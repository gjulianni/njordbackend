import { Request, Response } from 'express';
import CsvData from '../models/csvData';
import { pool } from '../databases/mysql/estfrn02';

export const uploadCsvData = async (req: Request, res: Response) => {
  try {
    let data = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ message: "Dados enviados não são um array." });
    }

    // Converte o campo Date para formato ISO string
    data = data.map((item: any) => {
      const dateStr = item.Date;
      if (typeof dateStr === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const [month, day, year] = dateStr.split("/").map(Number);
        const iso = new Date(year, month - 1, day).toISOString().split("T")[0]; // YYYY-MM-DD
        return { ...item, Date: iso };
      }
      return item;
    });

    await CsvData.insertMany(data);
    return res.status(200).json({ message: "Dados salvos com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao salvar dados", error });
  }
};

export const getCsvForDashboard = async (req: Request, res: Response) => {
  const { start, end, groupByHour } = req.query;

  if (!start || !end) {
    return res.status(400).json({ message: "Datas de início e fim são obrigatórias" });
  }

const startDate = new Date(`${start}T00:00:00Z`);
const endDate = new Date(`${end}T23:59:59Z`);


  
  try {
    const [data] = await pool.query(
      'SELECT *, DATE(reading_time) AS Date FROM `Sensor` WHERE reading_time BETWEEN ? AND ?',
      [startDate.toISOString(), endDate.toISOString()]
    );

    // Se for por dia, agrupar e calcular médias
    if (groupByHour === "false") {
      const agrupado: Record<string, any[]> = {};

      (data as any[]).forEach((item: any) => {
        if (!agrupado[item.Date]) agrupado[item.Date] = [];
        agrupado[item.Date].push(item);
      });
      
      const agregados = Object.entries(agrupado).map(([data, registros]: any) => {
        const soma = (campo: string) =>
          registros.reduce((acc: number, curr: any) => acc + parseFloat(curr[campo] || 0), 0);
        const media = (campo: string) => soma(campo) / registros.length;

        const date = new Date(data);
        const finalDate = date.toISOString().slice(0, 10);
        return {
          Date: finalDate,
          Temp_C: media("temp"),
          Hum_: media("hum"),
          SR_Wm2: Math.max(...registros.map((r: any) => parseFloat(r["uv_level"] || 0))),
          WindSpeed_Inst: Math.max(...registros.map((r: any) => parseFloat(r["wind_rt"] || 0)))
        };
      });

      return res.json(agregados);
    }

    // Se for por hora, retornar os dados originais
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: "Erro ao buscar dados", err });
  }
};

// Endpoint para buscar o último dado registrado
export const getLastCsvData = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM `Sensor` ORDER BY `reading_time` DESC LIMIT 1'
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return res.json(rows[0]);
    } else {
      return res.status(404).json({ message: "Nenhum dado encontrado." });
    }
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar o último dado", error });
  }
};

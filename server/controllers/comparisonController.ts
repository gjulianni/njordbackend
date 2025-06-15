import { Request, Response } from 'express';
import { pool } from '../databases/mysql/estfrn02';
import { pool_estfrn01 } from '../databases/mysql/estfrn01';
import { RowDataPacket } from 'mysql2';

export const compareData = async (req: Request, res: Response) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ message: "Datas de início e fim são obrigatórias" });
      }
    
      const startDate = new Date(`${start}T00:00:00.000Z`);
      const endDate = new Date(`${end}T23:59:59.999Z`);
    
      const startStr = startDate.toISOString().slice(0, 10);
      const endStr = endDate.toISOString().slice(0, 10);

      try {
        const [data1] = await pool_estfrn01.query<RowDataPacket[]>(
            'SELECT * FROM hydros28_estfrn01.Sensor WHERE reading_time BETWEEN ? AND ?',
            [startDate, endDate]
          );
          
          const [data2] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM hydros28_estfrn02.Sensor WHERE reading_time BETWEEN ? AND ?',
            [startDate, endDate]
          );

//console.log('Registros de data1:', data1.length);
//console.log('Registros de data2:', data2.length);
//console.log('Exemplo reading_time data1[0]:', data1[0]?.reading_time);
//console.log('Exemplo reading_time data2[0]:', data2[0]?.reading_time);

const minLength = Math.min(data1.length, data2.length);

const comparison = Array.from({ length: minLength }, (_, i) => {
    const record1 = data1[i];
    const record2 = data2[i];
  
    const diferenca: Record<string, number> = {};
  
    for (const key in record1) {
      if (key !== 'reading_time') {
        const val1 = Number(record1[key]);
        const val2 = Number(record2[key]);
        if (!isNaN(val1) && !isNaN(val2)) {
          diferenca[key] = Math.abs(val1 - val2);
        }
      }
    }
  
    return {
      reading_time_1: record1.reading_time,
      reading_time_2: record2.reading_time,
      estfrn01: record1,
      estfrn02: record2,
      diferenca,
    };
  });
  res.json(comparison);
      } catch (err) {
        console.error('Erro na comparação:', err)
        res.status(500).json({ erro: 'Erro ao comparar dados'});
      }
}
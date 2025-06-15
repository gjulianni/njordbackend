import mongoose from 'mongoose';

const csvDataSchema = new mongoose.Schema({}, { strict: false });

const CsvData = mongoose.model('CsvData', csvDataSchema);

export default CsvData;

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const getModel = (modelName) => {
  return genAI.getGenerativeModel({
    model: modelName || process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  });
};

module.exports = { genAI, getModel };

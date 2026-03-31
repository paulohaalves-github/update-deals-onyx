import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir arquivos estáticos

// Configuração da API Bitrix
const bitrixApi = axios.create({
  baseURL: process.env.BITRIX_WEBHOOK,
});

// Endpoint para consultar negócios por nome
app.get('/api/negocios', async (req, res) => {
  try {
    const { nome } = req.query;
    
    if (!nome || typeof nome !== "string") {
      return res.status(400).json({ 
        error: 'Nome inválido para busca',
        result: [] 
      });
    }

    console.log(`📄 [${new Date().toLocaleTimeString()}] Consultando negócios pelo nome "${nome}" ...`);
    
    const resposta = await bitrixApi.get("crm.deal.list", {
      params: {
        filter: {
          "%TITLE": nome
        },
        select: ["*", "UF_*"]
      }
    });

    const negocios = resposta?.data?.result || [];

    if (negocios.length === 0) {
      console.warn(`⚠️ [${new Date().toLocaleTimeString()}] Nenhum negócio encontrado contendo "${nome}" no título.`);
    }

    res.json({ result: negocios });

  } catch (err) {
    const detalheErro = err.response?.data || err.message;
    console.error(`❌ [${new Date().toLocaleTimeString()}] Erro ao consultar negócios:`, detalheErro);
    res.status(500).json({ 
      error: 'Erro ao consultar negócios',
      result: [] 
    });
  }
});

// Endpoint para atualizar negócio
app.post('/api/negocios/atualizar', async (req, res) => {
  try {
    const { id, fields } = req.body;
    
    if (!id || (typeof id !== "string" && typeof id !== "number")) {
      return res.status(400).json({ 
        error: 'ID do negócio inválido',
        result: false 
      });
    }

    if (!fields || typeof fields !== "object") {
      return res.status(400).json({ 
        error: 'Campos inválidos para atualização',
        result: false 
      });
    }

    console.log(`📄 [${new Date().toLocaleTimeString()}] Atualizando negócio ${id} ...`);
    
    const resposta = await bitrixApi.post("crm.deal.update", {
      id: id,
      fields: fields
    });

    const resultado = resposta?.data?.result || false;

    if (resultado === true) {
      console.log(`✅ [${new Date().toLocaleTimeString()}] Negócio ${id} atualizado com sucesso!`);
    } else {
      console.warn(`⚠️ [${new Date().toLocaleTimeString()}] Não foi possível atualizar negócio ${id}`, resposta?.data);
    }

    res.json({ result: resultado });

  } catch (err) {
    const detalheErro = err.response?.data || err.message;
    console.error(`❌ [${new Date().toLocaleTimeString()}] Erro ao atualizar negócio:`, detalheErro);
    res.status(500).json({ 
      error: 'Erro ao atualizar negócio',
      result: false 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📂 Frontend disponível em http://localhost:${PORT}`);
});



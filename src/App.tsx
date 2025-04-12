import React, { useState } from 'react';
import axios from 'axios';
import yf from 'yahoo-finance2';

// Função para verificar se o ativo é brasileiro (com sufixo '.SA')
const adicionarSufixoBR = (symbol: string) => {
  // Verifica se o ativo já contém o sufixo '.SA' ou se é um ativo brasileiro
  if (!symbol.includes('.SA')) {
    return symbol + '.SA'; // Adiciona o sufixo '.SA' para ativos brasileiros
  }
  return symbol; // Retorna o ativo sem mudanças se já tiver o sufixo
};

const fetchValorAtual = async (symbol: string) => {
  try {
    const simboloComSufixo = adicionarSufixoBR(symbol);

    // Requisição para o Yahoo Finance 2
    const resultado = await yf.quote(symbol = simboloComSufixo);

    // Verifica se conseguimos obter o preço do ativo
    if (resultado.regularMarketPrice) {
      return { price: resultado.regularMarketPrice };
    } else {
      throw new Error("Dados não encontrados.");
    }
  } catch (error) {
    console.error("Erro ao buscar valor do ativo:", error);
    return null;
  }
};

const App = () => {
  const [ativos, setAtivos] = useState([
    { nome: 'PETR3', investido: 10, dataInvestimento: '2025-04-12', valorAtual: 'Erro ao carregar' },
    { nome: 'GOOGL', investido: 20, dataInvestimento: '2025-04-12', valorAtual: 'Erro ao carregar' }
  ]);

  const atualizarValor = async (index: number) => {
    const ativo = ativos[index];
    const simboloComSufixo = adicionarSufixoBR(ativo.nome);

    // Log para depuração: verificar como o símbolo está sendo montado
    console.log("Buscando valor para o símbolo:", simboloComSufixo);

    const dadosAtivo = await fetchValorAtual(simboloComSufixo);

    if (dadosAtivo) {
      const valorAtual = dadosAtivo.price ? dadosAtivo.price : 'Erro ao carregar';
      const novosAtivos = [...ativos];
      novosAtivos[index] = { ...ativos[index], valorAtual };
      setAtivos(novosAtivos);
    } else {
      alert("Erro ao atualizar o valor do ativo.");
    }
  };

  const excluirAtivo = (index: number) => {
    const novosAtivos = ativos.filter((_, i) => i !== index);
    setAtivos(novosAtivos);
  };

  return (
    <div>
      <h1>Monitoramento de Ativos</h1>
      <table>
        <thead>
          <tr>
            <th>Nome do Ativo</th>
            <th>Valor Investido</th>
            <th>Data do Investimento</th>
            <th>Valor Atual</th>
            <th>Atualizar</th>
            <th>Excluir</th>
          </tr>
        </thead>
        <tbody>
          {ativos.map((ativo, index) => (
            <tr key={index}>
              <td>{ativo.nome}</td>
              <td>{ativo.investido}</td>
              <td>{ativo.dataInvestimento}</td>
              <td>{ativo.valorAtual}</td>
              <td><button onClick={() => atualizarValor(index)}>Atualizar Valor</button></td>
              <td><button onClick={() => excluirAtivo(index)}>Excluir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;

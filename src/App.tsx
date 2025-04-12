import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import fetchValorAtual from './fetchValorAtual';

interface Ativo {
  id: string;
  nome: string;
  valorInvestido: number;
  dataInvestimento: string;
  valorAtual: string | number;
}

const App = () => {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [novoAtivo, setNovoAtivo] = useState({
    nome: '',
    valorInvestido: 0,
    dataInvestimento: '',
  });
  const [loading, setLoading] = useState(false); // Para o estado de carregamento

  const handleAddAtivo = async () => {
    setLoading(true); // Inicia o carregamento
    try {
      const valorAtual = await fetchValorAtual(novoAtivo.nome);
      setAtivos([
        ...ativos,
        {
          id: uuidv4(),
          nome: novoAtivo.nome,
          valorInvestido: novoAtivo.valorInvestido,
          dataInvestimento: novoAtivo.dataInvestimento,
          valorAtual: valorAtual ? String(valorAtual) : 'Erro ao carregar', // Exibindo mensagem caso não haja valor
        },
      ]);
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
      setAtivos([
        ...ativos,
        {
          id: uuidv4(),
          nome: novoAtivo.nome,
          valorInvestido: novoAtivo.valorInvestido,
          dataInvestimento: novoAtivo.dataInvestimento,
          valorAtual: 'Erro ao carregar', // Caso aconteça algum erro durante a busca
        },
      ]);
    } finally {
      setLoading(false); // Finaliza o carregamento
    }

    setNovoAtivo({ nome: '', valorInvestido: 0, dataInvestimento: '' });
  };

  const handleDeleteAtivo = (id: string) => {
    setAtivos(ativos.filter((ativo) => ativo.id !== id));
  };

  return (
    <div>
      <h1>Monitoramento de Ativos</h1>

      <input
        type="text"
        placeholder="Nome do Ativo"
        value={novoAtivo.nome}
        onChange={(e) => setNovoAtivo({ ...novoAtivo, nome: e.target.value })}
      />
      <input
        type="number"
        placeholder="Valor Investido"
        value={novoAtivo.valorInvestido}
        onChange={(e) => setNovoAtivo({ ...novoAtivo, valorInvestido: parseFloat(e.target.value) })}
      />
      <input
        type="date"
        value={novoAtivo.dataInvestimento}
        onChange={(e) => setNovoAtivo({ ...novoAtivo, dataInvestimento: e.target.value })}
      />
      <button onClick={handleAddAtivo} disabled={loading}>
        {loading ? 'Carregando...' : 'Adicionar Ativo'}
      </button>

      <div>
        {ativos.map((ativo) => (
          <div key={ativo.id}>
            <h3>{ativo.nome}</h3>
            <p>Investido: {ativo.valorInvestido}</p>
            <p>Data do Investimento: {ativo.dataInvestimento}</p>
            <p>Valor Atual: {ativo.valorAtual}</p>
            <button onClick={() => handleDeleteAtivo(ativo.id)}>Excluir</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;

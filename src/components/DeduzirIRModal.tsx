import { useState } from 'react';
import { ResumoIR } from './ResumoIR';
import Button from './Button';
import { mesEncerrado } from '../utils/mesEncerrado';
import { X } from 'lucide-react';

interface Props {
  resumosIR: ResumoIR[];
  onClose: () => void;
  onConfirm: (senha: string) => void;
}

// Função para formatar o mês, ex: "Junho de 2025"
function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 2);
  let nomeMes = data.toLocaleString('pt-BR', { month: 'long' });
  nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  return `${nomeMes} de ${ano}`;
}

// NOVO: Função para formatar o subtipo, ex: "Ações"
function formatarSubtipo(subtipo: string): string {
  switch (subtipo.toLowerCase()) {
    case 'acao':
      return 'Ações';
    case 'fii':
      return 'FIIs';
    case 'criptomoeda':
      return 'Criptomoedas';
    default:
      return subtipo.toUpperCase();
  }
}

export default function DeduzirIRModal({ resumosIR, onClose, onConfirm }: Props) {
  const [senha, setSenha] = useState('');

  const resumosValidos = resumosIR.filter(r => mesEncerrado(r.mes) && r.imposto > 0);
  const resumosFuturos = resumosIR.filter(r => !mesEncerrado(r.mes) && r.imposto > 0);

  const handleConfirm = () => {
    if (senha.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }
    onConfirm(senha);
  };
  
  let aviso = '';
  if (resumosFuturos.length > 0) {
    const nomesMeses = resumosFuturos.map(r => formatarMesAno(r.mes)).join(', ');
    aviso = `Você tem impostos em aberto para o mês de ${nomesMeses}. Os valores estarão disponíveis para declaração após o encerramento do mês.`;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm relative">
        <h2 className="text-lg font-semibold mb-4 text-center">Resumo do Imposto de Renda</h2>

        {resumosValidos.length > 0 && (
          <button type="button" onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white text-lg font-bold transition" aria-label="Fechar">
            ×
          </button>
        )}

        {resumosValidos.length === 0 && resumosFuturos.length === 0 ? (
          <div className='text-center'>
            <p className="text-center text-gray-500 text-sm my-8">
              Não há impostos a serem declarados neste momento.
            </p>
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
              OK
            </Button>
          </div>
        ) : (
          <>
            {resumosValidos.length > 0 && (
              <ul className="space-y-4 max-h-[250px] overflow-y-auto mb-4 text-sm p-2 bg-gray-50 rounded-lg">
                {resumosValidos.map((r, i) => (
                  <li key={i} className="border-b pb-3 last:border-b-0">
                    {/* Linha do Título com subtipo formatado */}
                    <p className='font-bold text-base mb-2'>{formatarMesAno(r.mes)} ({formatarSubtipo(r.subtipo)})</p>
                    
                    {/* NOVAS LINHAS: Venda e Compra */}
                    <div className='flex justify-between text-xs text-gray-600'><span>Total da Venda:</span><span>R$ {r.totalVendidoNoMes.toFixed(2)}</span></div>
                    <div className='flex justify-between text-xs text-gray-600 mb-2'><span>Total da Compra:</span><span>R$ {r.valorCompra.toFixed(2)}</span></div>

                    {/* Restante do resumo */}
                    <div className='flex justify-between'><span>Resultado do Mês:</span><span className={r.resultadoMesBruto >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>R$ {r.resultadoMesBruto.toFixed(2)}</span></div>
                    <div className='flex justify-between'><span>(-) Prejuízo Compensado:</span><span className='text-red-700 font-semibold'>R$ {r.prejuizoCompensado.toFixed(2)}</span></div>
                    <div className='flex justify-between border-t mt-1 pt-1 font-semibold'><span>(=) Base de Cálculo IR:</span><span>R$ {r.baseCalculo.toFixed(2)}</span></div>
                    <div className='flex justify-between mt-2 text-blue-800 font-bold bg-blue-100 p-1 rounded'><span>IR Devido no Mês:</span><span>R$ {r.imposto.toFixed(2)}</span></div>
                  </li>
                ))}
              </ul>
            )}

            {aviso && (
              <p className="text-xs text-yellow-800 bg-yellow-100 p-2 rounded-lg my-4">
                ⚠️ {aviso}
              </p>
            )}

            {resumosValidos.length > 0 ? (
              <>
                <div className="mb-4">
                  <label htmlFor="senha-ir-modal" className="block mb-1 font-medium">Senha (6 dígitos)</label>
                  <input id="senha-ir-modal" type="password" value={senha} maxLength={6} onChange={(e) => setSenha(e.target.value)} placeholder="******" className="w-full p-3 border-2 border-gray-300 rounded-lg"/>
                </div>
                <div className="flex justify-between">
                  <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white">Cancelar</Button>
                  <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white">Confirmar Dedução</Button>
                </div>
              </>
            ) : (
              <div className="text-center mt-4">
                 <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                   Entendi
                 </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
import { ResumoIR } from './ResumoIR';
import Button from './Button'; // Usando seu componente de botão padrão
import { X } from 'lucide-react'; // Importando o ícone de fechar

// --- Adicionamos as mesmas funções de formatação que usamos no outro modal ---
function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 2);
  let nomeMes = data.toLocaleString('pt-BR', { month: 'long' });
  nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  return `${nomeMes} de ${ano}`;
}

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
// --- Fim das funções de formatação ---

interface Props {
  resumosIR: ResumoIR[];
  onClose: () => void;
}

export default function ResumoIRModal({ resumosIR, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Container principal com a classe "relative" para o botão fechar */}
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm relative">

        <h2 className="text-lg font-semibold mb-4 text-center">Resumo do Imposto de Renda</h2>
        
        {/* Botão de fechar 'X' no canto */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white text-lg font-bold transition"
          aria-label="Fechar"
        >
          ×
        </button>

        {resumosIR.length === 0 ? (
          <p className="text-center text-gray-500 text-sm my-8">
            Nenhum imposto apurado para este período.
          </p>
        ) : (
          <ul className="space-y-4 max-h-[60vh] overflow-y-auto mb-4 text-sm p-2 bg-gray-50 rounded-lg">
            {resumosIR.map((r, i) => (
              <li key={i} className="border-b pb-3 last:border-b-0">
                {/* Usando o mesmo layout do outro modal */}
                <p className='font-bold text-base mb-2'>{formatarMesAno(r.mes)} ({formatarSubtipo(r.subtipo)})</p>
                
                <div className='flex justify-between text-xs text-gray-600'><span>Total Vendido:</span><span>R$ {r.totalVendidoNoMes.toFixed(2)}</span></div>
                <div className='flex justify-between text-xs text-gray-600 mb-2'><span>Custo Aquisição:</span><span>R$ {r.valorCompra.toFixed(2)}</span></div>

                <div className='flex justify-between'><span>Resultado do Mês:</span><span className={r.resultadoMesBruto >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>R$ {r.resultadoMesBruto.toFixed(2)}</span></div>
                <div className='flex justify-between'><span>(-) Prejuízo Compensado:</span><span className='text-red-700 font-semibold'>R$ {r.prejuizoCompensado.toFixed(2)}</span></div>
                <div className='flex justify-between border-t mt-1 pt-1 font-semibold'><span>(=) Base de Cálculo IR:</span><span>R$ {r.baseCalculo.toFixed(2)}</span></div>
                <div className='flex justify-between mt-2 text-blue-800 font-bold bg-blue-100 p-1 rounded'><span>IR Devido no Mês:</span><span>R$ {r.imposto.toFixed(2)}</span></div>
              </li>
            ))}
          </ul>
        )}
        
        <div className="text-center mt-6">
          <Button onClick={onClose} className="bg-blue-600 text-white hover:bg-blue-700 w-full">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
import { Button } from '../ui/button'; // Adapte para seu sistema de design

interface TipoAtivoStepProps {
  onNext: (tipo: 'rendaFixa' | 'rendaVariavel') => void;
}

export default function TipoAtivoStep({ onNext }: TipoAtivoStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Selecione o Tipo de Ativo</h2>
      
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => onNext('rendaFixa')}
          className="p-4 border rounded-lg hover:bg-gray-50 text-left"
        >
          <h3 className="font-medium">Renda Fixa</h3>
          <p className="text-sm text-gray-600">CDB, LCI, LCA, Tesouro Direto, etc.</p>
        </button>
        
        <button
          onClick={() => onNext('rendaVariavel')}
          className="p-4 border rounded-lg hover:bg-gray-50 text-left"
        >
          <h3 className="font-medium">Renda Variável</h3>
          <p className="text-sm text-gray-600">Ações, FIIs, Criptomoedas, ETFs</p>
        </button>
      </div>
    </div>
  );
}
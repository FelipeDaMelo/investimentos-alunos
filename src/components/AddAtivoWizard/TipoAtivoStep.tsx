interface TipoAtivoStepProps {
  onNext: (tipo: string) => void;
}

export default function TipoAtivoStep({ onNext }: TipoAtivoStepProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Selecione o Tipo de Ativo</h2>
      
      <div className="grid gap-4">
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
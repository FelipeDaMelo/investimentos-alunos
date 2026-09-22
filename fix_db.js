import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fix() {
  console.log("Fetching users...");
  const usersRef = collection(db, 'usuarios');
  const snapshot = await getDocs(usersRef);
  
  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    if (!data.historico) continue;
    
    const zecCompras = data.historico.filter(h => h.nome === 'ZEC' && h.tipo === 'compra');
    if (zecCompras.length > 0) {
      console.log(`Found ZEC in user: ${userDoc.id}`);
      
      const ativos = data.ativos || [];
      const zecNaCarteira = ativos.some(a => a.nome === 'ZEC');
      
      if (!zecNaCarteira) {
        console.log(`ZEC not in carteira. Fixing...`);
        
        const quantidadeTotal = zecCompras.reduce((total, compra) => total + (compra.quantidade || 1.5), 0);
        const valorInvestidoTotal = zecCompras.reduce((total, compra) => total + compra.valor, 0);
        const precoMedio = valorInvestidoTotal / quantidadeTotal;
        
        const arrayCompras = zecCompras.map(c => ({ data: c.data, valor: c.valor }));
        const dataHoje = new Date().toISOString().split('T')[0];

        const novosAtivos = [...ativos];
        const zecAtivo = {
          id: new Date(zecCompras[0].data).getTime().toString(),
          nome: 'ZEC',
          tipo: 'rendaVariavel',
          subtipo: 'criptomoeda',
          tickerFormatado: 'ZEC-USD',
          quantidade: quantidadeTotal,
          valorInvestido: valorInvestidoTotal,
          precoMedio: precoMedio,
          valorAtual: zecCompras[0].valor / (zecCompras[0].quantidade || 1.5),
          patrimonioPorDia: {
            [dataHoje]: valorInvestidoTotal
          },
          compras: arrayCompras
        };
        novosAtivos.push(zecAtivo);

        await updateDoc(doc(db, 'usuarios', userDoc.id), { 
          ativos: novosAtivos
        });
        
        console.log(`Successfully fixed user ${userDoc.id}!`);
      }
    }
  }
  console.log("Done.");
  process.exit(0);
}
fix();

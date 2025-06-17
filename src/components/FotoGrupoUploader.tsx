import { useEffect, useRef, useState } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { storage } from '../firebaseConfig';
import { Pencil } from 'lucide-react';

interface FotoGrupoUploaderProps {
  login: string;
  fotoUrlAtual?: string;
}

export default function FotoGrupoUploader({ login, fotoUrlAtual }: FotoGrupoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(fotoUrlAtual || null);
  const [uploading, setUploading] = useState(false);

  // 🟢 Atualiza preview quando a prop muda (corrige o bug)
  useEffect(() => {
    setPreview(fotoUrlAtual || null);
  }, [fotoUrlAtual]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `fotosGrupos/${login}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const docRef = doc(db, 'usuarios', login);
      await updateDoc(docRef, { fotoGrupo: url });

      setPreview(url);
    } catch (error) {
      alert('Erro ao enviar imagem.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-30 h-30">
      <img
        src={preview || '/usuario-placeholder.png'}
        alt="Foto do grupo"
        className="w-20 h-20 rounded-full object-cover border"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow hover:bg-gray-100"
        title="Editar foto"
        disabled={uploading}
      >
        <Pencil className="w-4 h-4 text-gray-700" />
      </button>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}

import { useRef, useState } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { storage } from '../firebaseConfig';

interface FotoGrupoUploaderProps {
  login: string;
  fotoUrlAtual?: string;
}

export default function FotoGrupoUploader({ login, fotoUrlAtual }: FotoGrupoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(fotoUrlAtual || null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const storageRef = ref(storage, `fotosGrupos/${login}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

console.log('URL da imagem:', url);

const docRef = doc(db, 'usuarios', login);
await setDoc(docRef, { fotoGrupo: url }, { merge: true });

console.log('URL salva no Firestore com sucesso');

      setPreview(url);
    } catch (error) {
      alert('Erro ao enviar imagem.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      {preview && (
        <img
          src={preview}
          alt="Foto do grupo"
          className="w-16 h-16 rounded-full border object-cover"
        />
      )}
      <div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {uploading ? 'Enviando...' : 'Escolher Foto'}
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

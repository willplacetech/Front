export default function Loading({ texto = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-14 h-14 border-4 border-placetech-100 border-t-placetech-500 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium">{texto}</p>
    </div>
  );
}
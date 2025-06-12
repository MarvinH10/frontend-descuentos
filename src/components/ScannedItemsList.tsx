import React from 'react';
import { Search, Trash2, List, Package } from 'lucide-react';

interface ScannedItem {
  code: string;
  timestamp: number;
  status: 'pending' | 'searching' | 'found' | 'error';
  error?: string;
}

interface ScannedItemsListProps {
  items: ScannedItem[];
  onSearch: (code: string) => void;
  onSearchAll: () => void;
  onRemove: (code: string) => void;
  onClearAll: () => void;
  isLoading: boolean;
}

const ScannedItemsList: React.FC<ScannedItemsListProps> = ({
  items,
  onSearch,
  onSearchAll,
  onRemove,
  onClearAll,
  isLoading
}) => {
  if (items.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <List className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No hay códigos escaneados</p>
        <p className="text-sm text-gray-400 mt-1">Los códigos escaneados aparecerán aquí</p>
      </div>
    );
  }

  const pendingItems = items.filter(item => item.status === 'pending');

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="font-medium">Códigos Escaneados ({items.length})</h3>
          {pendingItems.length > 0 && (
            <p className="text-sm text-gray-500">{pendingItems.length} pendientes de búsqueda</p>
          )}
        </div>
        <div className="flex gap-2">
          {pendingItems.length > 0 && (
            <button
              onClick={onSearchAll}
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              Buscar Todos
            </button>
          )}
          <button
            onClick={onClearAll}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Limpiar
          </button>
        </div>
      </div>

      <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <li key={item.code} className="p-3 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-sm">{item.code}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
                {item.status === 'error' && (
                  <div className="mt-1 text-xs text-red-500">
                    {item.error || 'Error al buscar'}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'pending' && (
                  <button
                    onClick={() => onSearch(item.code)}
                    disabled={isLoading}
                    className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                )}
                {item.status === 'searching' && (
                  <div className="p-1.5">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <button
                  onClick={() => onRemove(item.code)}
                  className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScannedItemsList;
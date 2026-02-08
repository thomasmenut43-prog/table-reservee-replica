import React, { useState, useRef } from 'react';
import { Users, Edit2, Grid3x3, Move, Ban, CheckCircle, Building2, Zap, Trash2, RotateCw, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function TableFloorPlan({ tables, onTableClick, onUpdatePosition, zone, blockedTables, onBlockTable, onUnblockTable }) {
  const [draggingTable, setDraggingTable] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [floorElements, setFloorElements] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [draggingElement, setDraggingElement] = useState(null);
  const [elementDragOffset, setElementDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  
  const gridSize = 25; // Taille d'une cellule en pixels
  const gridCols = 30;
  const gridRows = 20;

  // Initialiser les positions des tables si elles n'existent pas
  const tablesWithPositions = tables.map(table => {
    const baseX = table.x !== null && table.x !== undefined ? table.x : Math.floor(Math.random() * (gridCols - 4));
    const baseY = table.y !== null && table.y !== undefined ? table.y : Math.floor(Math.random() * (gridRows - 3));
    
    // Utiliser la position en cours de drag si applicable
    const x = draggingTable === table.id ? dragPosition.x : baseX;
    const y = draggingTable === table.id ? dragPosition.y : baseY;
    
    return {
      ...table,
      x,
      y,
      width: table.width || 3,
      height: table.height || 2
    };
  });

  const handleMouseDown = (e, table) => {
    if (e.target.closest('.table-actions')) return; // Ignorer si clic sur les boutons
    
    const rect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - (table.x * gridSize);
    const offsetY = e.clientY - rect.top - (table.y * gridSize);
    
    setDraggingTable(table.id);
    setDragOffset({ x: offsetX, y: offsetY });
    setDragPosition({ x: table.x, y: table.y });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!draggingTable) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left - dragOffset.x;
    const pixelY = e.clientY - rect.top - dragOffset.y;

    const table = tablesWithPositions.find(t => t.id === draggingTable);
    if (!table) return;

    // Garder en pixels pour fluidité, convertir en grille seulement à la fin
    let x = pixelX;
    let y = pixelY;

    // Contraintes du canvas
    x = Math.max(0, Math.min(gridCols * gridSize - (table.width * gridSize), x));
    y = Math.max(0, Math.min(gridRows * gridSize - (table.height * gridSize), y));

    // Convertir en position de grille
    const gridX = Math.round(x / gridSize);
    const gridY = Math.round(y / gridSize);

    setDragPosition({ x: gridX, y: gridY });
  };

  const handleMouseUp = () => {
    if (draggingTable && (dragPosition.x !== undefined && dragPosition.y !== undefined)) {
      const table = tables.find(t => t.id === draggingTable);
      // Sauvegarder la position définitive seulement à la fin
      if (table && (dragPosition.x !== table.x || dragPosition.y !== table.y)) {
        onUpdatePosition(draggingTable, { x: dragPosition.x, y: dragPosition.y });
      }
    }
    setDraggingTable(null);
    setDragOffset({ x: 0, y: 0 });
    setDragPosition({ x: 0, y: 0 });
  };

  const isTableBlocked = (tableId) => {
    return blockedTables?.some(b => b.tableId === tableId);
  };

  const getTableBlock = (tableId) => {
    return blockedTables?.find(b => b.tableId === tableId);
  };

  const handleCanvasClick = (e) => {
    if (!selectedTool || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newElement = {
      id: `${selectedTool}-${Date.now()}`,
      type: selectedTool,
      x,
      y,
      width: selectedTool === 'wall' ? 100 : (selectedTool === 'round-table' ? 60 : 40),
      height: selectedTool === 'wall' ? 20 : (selectedTool === 'round-table' ? 60 : 40),
      rotation: 0,
      capacity: selectedTool === 'round-table' ? 4 : undefined
    };

    setFloorElements([...floorElements, newElement]);
  };

  const handleElementMouseDown = (e, elementId) => {
    e.stopPropagation();
    e.preventDefault();

    const element = floorElements.find(el => el.id === elementId);
    if (!element || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setDraggingElement(elementId);
    setElementDragOffset({
      x: e.clientX - rect.left - element.x,
      y: e.clientY - rect.top - element.y
    });
  };

  React.useEffect(() => {
    if (!draggingElement) return;

    const handleMouseMove = (e) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(gridCols * gridSize - 50, e.clientX - rect.left - elementDragOffset.x));
      const y = Math.max(0, Math.min(gridRows * gridSize - 50, e.clientY - rect.top - elementDragOffset.y));

      setFloorElements(prev => {
        const draggingEl = prev.find(el => el.id === draggingElement);
        if (!draggingEl) return prev;

        const updatedEl = { ...draggingEl, x, y };
        const snappedEl = checkSnapping(updatedEl);

        return prev.map(el => 
          el.id === draggingElement ? snappedEl : el
        );
      });
    };

    const handleMouseUp = () => {
      setDraggingElement(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingElement, elementDragOffset, floorElements]);

  const deleteElement = (elementId) => {
    setFloorElements(floorElements.filter(el => el.id !== elementId));
  };

  const rotateElement = (elementId) => {
    setFloorElements(prev =>
      prev.map(el =>
        el.id === elementId ? { ...el, rotation: (el.rotation || 0) + 90 } : el
      )
    );
  };

  const checkSnapping = (element) => {
    const snapDistance = 15;
    let snappedElement = { ...element };

    floorElements.forEach(otherEl => {
      if (otherEl.id === element.id || otherEl.type !== 'wall') return;

      // Check horizontal snapping (left/right edges)
      if (Math.abs(element.x - (otherEl.x + otherEl.width)) < snapDistance) {
        snappedElement.x = otherEl.x + otherEl.width;
      }
      if (Math.abs((element.x + element.width) - otherEl.x) < snapDistance) {
        snappedElement.x = otherEl.x - element.width;
      }

      // Check vertical snapping (top/bottom edges)
      if (Math.abs(element.y - (otherEl.y + otherEl.height)) < snapDistance) {
        snappedElement.y = otherEl.y + otherEl.height;
      }
      if (Math.abs((element.y + element.height) - otherEl.y) < snapDistance) {
        snappedElement.y = otherEl.y - element.height;
      }
    });

    return snappedElement;
  };

  return (
    <Card className="p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Plan de salle - {zone}</h3>
        </div>
        <Badge variant="secondary">
          {tables.length} table{tables.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap gap-2 p-3 bg-white border rounded-lg">
        <TooltipProvider>
          <div className="flex items-center gap-2 border-r pr-3">
            <span className="text-xs font-medium text-gray-600">Ajouter :</span>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={selectedTool === 'wall' ? 'default' : 'outline'}
                onClick={() => setSelectedTool(selectedTool === 'wall' ? null : 'wall')}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Mur
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cliquez sur le plan pour ajouter un mur</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={selectedTool === 'pillar' ? 'default' : 'outline'}
                onClick={() => setSelectedTool(selectedTool === 'pillar' ? null : 'pillar')}
              >
                <Zap className="h-4 w-4 mr-2" />
                Pilier
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cliquez sur le plan pour ajouter un pilier</TooltipContent>
          </Tooltip>

          <div className="border-r pr-3" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={selectedTool === 'round-table' ? 'default' : 'outline'}
                onClick={() => setSelectedTool(selectedTool === 'round-table' ? null : 'round-table')}
              >
                <Circle className="h-4 w-4 mr-2" />
                Table ronde
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cliquez sur le plan pour ajouter une table ronde</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Grid Canvas */}
      <div 
        ref={canvasRef}
        className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden select-none"
        style={{
          width: `${gridCols * gridSize}px`,
          height: `${gridRows * gridSize}px`,
          backgroundImage: `
            linear-gradient(to right, #f3f4f6 1px, transparent 1px),
            linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          cursor: selectedTool ? 'crosshair' : (draggingTable ? 'grabbing' : 'default')
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {floorElements.map((element) => (
          <div
            key={element.id}
            className="absolute group"
            style={{
              left: `${element.x}px`,
              top: `${element.y}px`,
              width: `${element.width}px`,
              height: `${element.height}px`,
              zIndex: draggingElement === element.id ? 1000 : 1,
              transition: draggingElement === element.id ? 'none' : 'all 0.2s',
              transform: `rotate(${element.rotation || 0}deg)`
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
          >
            {element.type === 'wall' && (
              <div className="w-full h-full bg-gray-800 hover:bg-gray-700 shadow-lg rounded cursor-grab active:cursor-grabbing group-hover:shadow-xl flex items-center justify-center relative">
                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateElement(element.id);
                    }}
                  >
                    <RotateCw className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElement(element.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            {element.type === 'pillar' && (
              <div className="w-full h-full bg-gray-400 hover:bg-gray-300 shadow-lg rounded-full cursor-grab active:cursor-grabbing group-hover:shadow-xl flex items-center justify-center">
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(element.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            {element.type === 'round-table' && (
              <div className="w-full h-full bg-blue-400 hover:bg-blue-300 shadow-lg rounded-full cursor-grab active:cursor-grabbing group-hover:shadow-xl flex items-center justify-center border-2 border-blue-500 relative">
                <div className="text-center text-white text-xs font-semibold">
                  <div>{element.capacity}</div>
                </div>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-5 w-5 absolute opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(element.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {tablesWithPositions.map((table) => {
          const blocked = isTableBlocked(table.id);
          const block = getTableBlock(table.id);

          return (
            <div
              key={table.id}
              className="absolute group"
              style={{
                left: `${table.x * gridSize}px`,
                top: `${table.y * gridSize}px`,
                width: `${table.width * gridSize}px`,
                height: `${table.height * gridSize}px`,
                zIndex: draggingTable === table.id ? 1000 : 1,
                transition: draggingTable === table.id ? 'none' : 'all 0.2s'
              }}
            >
              <div 
                className={`w-full h-full shadow-lg border-2 flex flex-col items-center justify-center text-white font-semibold transition-all ${
                  table.tableShape === 'round' ? 'rounded-full' : 'rounded-lg'
                } ${
                  blocked 
                    ? 'bg-red-500 border-red-600' 
                    : 'bg-orange-500 border-orange-600 cursor-grab active:cursor-grabbing group-hover:shadow-xl'
                }`}
                onMouseDown={(e) => !blocked && handleMouseDown(e, table)}
              >
                <span className="text-sm">{table.name}</span>
                <div className="flex items-center gap-1 text-xs opacity-90">
                  <Users className="h-3 w-3" />
                  <span>{table.capacity}</span>
                </div>
                {blocked && (
                  <Badge className="bg-white/20 text-white text-[10px] mt-1">
                    Occupée
                  </Badge>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="table-actions absolute -bottom-10 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTableClick(table);
                  }}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
                {blocked ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnblockTable(block.id);
                    }}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Libérer
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBlockTable(table);
                    }}
                  >
                    <Ban className="h-3 w-3 mr-1" />
                    Occuper
                  </Button>
                )}
              </div>
              
              {/* Drag indicator */}
              {!blocked && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-white rounded-full p-1 shadow-md">
                    <Move className="h-3 w-3 text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Grid3x3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune table dans cette zone</p>
              <p className="text-xs">Cliquez sur "Ajouter une table" pour commencer</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Occupée</span>
        </div>
        <span>•</span>
        <span>Glissez-déposez les tables pour les déplacer</span>
      </div>
    </Card>
  );
}
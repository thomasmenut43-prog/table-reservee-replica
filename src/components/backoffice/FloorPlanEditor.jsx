import React, { useState, useRef } from 'react';
import { Grid3x3, Move, Trash2, Plus, Square, Circle, Building2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function FloorPlanEditor({ 
  elements = [], 
  onElementAdd, 
  onElementUpdate, 
  onElementDelete,
  width = 800,
  height = 600 
}) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [draggingElement, setDraggingElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

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
      width: selectedTool === 'wall' ? 100 : (selectedTool === 'pillar' ? 40 : 60),
      height: selectedTool === 'wall' ? 20 : (selectedTool === 'pillar' ? 40 : 60),
      rotation: 0,
      color: getElementColor(selectedTool),
      tableShape: selectedTool === 'table' ? 'round' : null,
      tableCapacity: selectedTool === 'table' ? 4 : null,
      name: selectedTool === 'table' ? `T-${Date.now().toString().slice(-3)}` : null
    };

    onElementAdd(newElement);
  };

  const handleElementMouseDown = (e, elementId) => {
    if (!canvasRef.current) return;
    e.stopPropagation();

    const rect = canvasRef.current.getBoundingClientRect();
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    setDraggingElement(elementId);
    setDragOffset({
      x: e.clientX - rect.left - element.x,
      y: e.clientY - rect.top - element.y
    });
  };

  const handleMouseMove = (e) => {
    if (!draggingElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(width - 50, e.clientX - rect.left - dragOffset.x));
    const y = Math.max(0, Math.min(height - 50, e.clientY - rect.top - dragOffset.y));

    onElementUpdate(draggingElement, { x, y });
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
  };

  const getElementColor = (type) => {
    const colors = {
      wall: '#2d3748',
      pillar: '#a0aec0',
      table: '#48bb78'
    };
    return colors[type] || '#4f46e5';
  };

  const renderElement = (element) => {
    const baseProps = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      cursor: draggingElement === element.id ? 'grabbing' : 'grab',
      opacity: draggingElement === element.id ? 0.8 : 1,
      transition: draggingElement === element.id ? 'none' : 'all 0.2s',
      zIndex: draggingElement === element.id ? 1000 : 1
    };

    switch (element.type) {
      case 'wall':
        return (
          <div
            key={element.id}
            className="absolute bg-gray-800 shadow-lg hover:bg-gray-700 group"
            style={{
              ...baseProps,
              width: `${element.width}px`,
              height: `${element.height}px`,
              borderRadius: '2px'
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
          >
            <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                className="h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onElementDelete(element.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );

      case 'pillar':
        return (
          <div
            key={element.id}
            className="absolute bg-gray-400 shadow-lg hover:bg-gray-300 group rounded-full"
            style={{
              ...baseProps,
              width: `${element.width}px`,
              height: `${element.height}px`
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
          >
            <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="destructive"
                className="h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onElementDelete(element.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );

      case 'table':
        const isRound = element.tableShape === 'round';
        const isHex = element.tableShape === 'hexagon';
        
        return (
          <div
            key={element.id}
            className={`absolute shadow-lg group flex items-center justify-center text-white font-bold text-sm transition-all ${
              isRound ? 'rounded-full' : isHex ? '' : 'rounded-lg'
            }`}
            style={{
              ...baseProps,
              width: `${element.width}px`,
              height: `${element.height}px`,
              backgroundColor: '#48bb78',
              border: '2px solid #38a169',
              clipPath: isHex ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : 'none',
              cursor: draggingElement === element.id ? 'grabbing' : 'grab'
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
          >
            <span>{element.name}</span>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 whitespace-nowrap">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Éditer
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-6 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onElementDelete(element.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Plan de salle</h3>
        </div>
        <Badge variant="secondary">
          {elements.length} élément{elements.length > 1 ? 's' : ''}
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
            <TooltipContent>Cliquez pour ajouter un mur</TooltipContent>
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
            <TooltipContent>Cliquez pour ajouter un pilier</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={selectedTool === 'table' ? 'default' : 'outline'}
                onClick={() => setSelectedTool(selectedTool === 'table' ? null : 'table')}
              >
                <Circle className="h-4 w-4 mr-2" />
                Table
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cliquez pour ajouter une table</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-lg overflow-hidden select-none"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          cursor: selectedTool ? 'crosshair' : 'default'
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Elements */}
        {elements.map(element => renderElement(element))}

        {/* Empty state */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Grid3x3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sélectionnez un outil et cliquez pour ajouter des éléments</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Glissez-déposez les éléments pour les déplacer • Cliquez sur les boutons de suppression pour les retirer</p>
      </div>
    </Card>
  );
}
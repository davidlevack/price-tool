import React, { useState, useCallback } from 'react';
import { Menu, X, ChevronLeft, MoreVertical, ChevronDown, Save, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Types
type TableType = 'weekly-data' | 'promotion-planning' | 'white-ticket';
type GridPosition = { row: number; col: number; width: number };
type TableData = {
  id: string;
  type: TableType;
  position: GridPosition;
  filters: any;
  columns: string[];
  data: any[];
};

const PriceTool = () => {
  // State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tables, setTables] = useState<TableData[]>([]);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [isSaveLayoutModalOpen, setIsSaveLayoutModalOpen] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState<{name: string, layout: TableData[]}[]>([]);
  const [deleteLayoutId, setDeleteLayoutId] = useState<string | null>(null);

  // Table Templates
  const tableTemplates = [
    { id: 'white-ticket', title: 'WHITE TICKET TABLE', type: 'white-ticket' as TableType },
    { id: 'promo-planning', title: 'PROMOTION PLANNING TABLE', type: 'promotion-planning' as TableType },
    { id: 'weekly-data', title: 'WEEKLY PRICE DATA TABLE', type: 'weekly-data' as TableType }
  ];

  // Available Metrics for Column Headers
  const availableMetrics = [
    'Sales $', 'Units', 'LY PPT', 'AUR', 'Price', 'IMU', 'Ranking',
    'White Ticket Price', 'Promo event', 'Notes'
  ];

  // Filter Options
  const productHierarchy = {
    departments: ['Women\'s dress shoes', 'Men\'s casual shoes'],
    classes: { 'Women\'s dress shoes': ['Aged/strappy', 'Classic'] },
    subClasses: { 'Aged/strappy': ['Candies', 'Formal'] },
    styles: { 'Candies': ['Two strap woven', 'Single strap leather'] }
  };

  // Drag and Drop Handlers
  const handleDragStart = (tableId: string) => {
    setDraggedTable(tableId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (row: number, col: number) => {
    if (!draggedTable) return;

    const existingTableIndex = tables.findIndex(t => 
      t.position.row === row && t.position.col === col
    );

    if (existingTableIndex !== -1) {
      // Find next available position
      const nextPosition = findNextAvailablePosition(tables);
      if (nextPosition) {
        const updatedTables = [...tables];
        updatedTables[existingTableIndex].position = nextPosition;
        setTables(updatedTables);
      }
    }

    // Add new table
    const template = tableTemplates.find(t => t.id === draggedTable);
    if (template) {
      setTables([...tables, {
        id: `${template.id}-${Date.now()}`,
        type: template.type,
        position: { row, col, width: 1 },
        filters: {},
        columns: getDefaultColumns(template.type),
        data: []
      }]);
    }

    setDraggedTable(null);
  };

  // Helper Functions
  const findNextAvailablePosition = (tables: TableData[]): GridPosition | null => {
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 2; col++) {
        const isOccupied = tables.some(t => 
          t.position.row === row && t.position.col === col
        );
        if (!isOccupied) return { row, col, width: 1 };
      }
    }
    return null;
  };

  const getDefaultColumns = (type: TableType): string[] => {
    switch (type) {
      case 'weekly-data':
        return ['Week', 'Sales $', 'Units', 'LY PPT', 'AUR', 'Price'];
      case 'promotion-planning':
        return ['Promo event', 'Price', 'Units', 'Sales $', 'AUR', 'Notes'];
      case 'white-ticket':
        return ['White Ticket Price', 'Ranking', 'Units', 'AUR', 'Sales $', 'IMU'];
      default:
        return [];
    }
  };

  // Table Component
  const Table = ({ table }: { table: TableData }) => {
    const [isColumnSelectOpen, setIsColumnSelectOpen] = useState(false);
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

    return (
      <div className={`bg-white rounded-lg shadow ${
        table.position.width === 2 ? 'col-span-2' : ''
      }`}>
        <div className="p-4">
          {/* Table Header */}
          <div className="flex justify-between items-center mb-4">
            <Select value={table.type} onValueChange={(value: TableType) => {
              const updatedTables = tables.map(t =>
                t.id === table.id ? { ...t, type: value } : t
              );
              setTables(updatedTables);
            }}>
              <SelectTrigger>
                <SelectValue>{table.type}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tableTemplates.map(template => (
                  <SelectItem key={template.id} value={template.type}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="ghost" size="icon" onClick={() => {
              setActiveTableId(table.id);
              setIsFilterModalOpen(true);
            }}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {table.columns.map((column, index) => (
                    <th key={index} className="px-4 py-2 text-left">
                      <Button
                        variant="ghost"
                        className="font-normal"
                        onClick={() => {
                          setSelectedColumn(column);
                          setIsColumnSelectOpen(true);
                        }}
                      >
                        {column}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Placeholder rows */}
                {[1, 2, 3].map(row => (
                  <tr key={row}>
                    {table.columns.map((_, index) => (
                      <td key={index} className="px-4 py-2 border-t">
                        {/* Placeholder data */}
                        {row * (index + 1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Filter Modal
  const FilterModal = () => {
    const [filters, setFilters] = useState({
      dept: '',
      class: '',
      subClass: '',
      style: '',
      timePeriod: '',
      startDate: '',
      endDate: ''
    });

    const activeTable = tables.find(t => t.id === activeTableId);

    return (
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Options</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Select
              value={filters.dept}
              onValueChange={(value) => setFilters({ ...filters, dept: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {productHierarchy.departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filters.dept && (
              <Select
                value={filters.class}
                onValueChange={(value) => setFilters({ ...filters, class: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {productHierarchy.classes[filters.dept]?.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {activeTable?.type === 'weekly-data' && (
              <>
                <Select
                  value={filters.timePeriod}
                  onValueChange={(value) => setFilters({ ...filters, timePeriod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fall-2024">Fall 2024</SelectItem>
                    <SelectItem value="spring-2024">Spring 2024</SelectItem>
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsFilterModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (activeTableId) {
                const updatedTables = tables.map(t =>
                  t.id === activeTableId ? { ...t, filters } : t
                );
                setTables(updatedTables);
                setIsFilterModalOpen(false);
              }
            }}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Save Layout Modal
  const SaveLayoutModal = () => {
    const [layoutName, setLayoutName] = useState('');

    return (
      <Dialog open={isSaveLayoutModalOpen} onOpenChange={setIsSaveLayoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Layout</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Layout name"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSaveLayoutModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setSavedLayouts([...savedLayouts, {
                name: layoutName,
                layout: tables
              }]);
              setIsSaveLayoutModalOpen(false);
              setLayoutName('');
            }}>
              Save Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`bg-white border-r transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b">
          {!isSidebarCollapsed && <span className="text-indigo-700 font-medium">PRICE TOOL</span>}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-4">
            {!isSidebarCollapsed && "Drag the tables below to the right staging area"}
          </p>
          
          {/* Table Templates */}
          <div className="space-y-2">
            {tableTemplates.map(template => (
              <div
                key={template.id}
                className="p-3 bg-white border rounded cursor-move hover:border-indigo-500"
                draggable="true"
                onDragStart={() => handleDragStart(template.id)}
              >
                {isSidebarCollapsed ? (
                  <div className="flex justify-center">
                    <Menu size={20} />
                  </div>
                ) : (
                  template.title
                )}
              </div>
            ))}
          </div>

          {/* Saved Layouts */}
          {!isSidebarCollapsed && (
            <div className="mt-8">
              <button
                className="flex items-center space-x-2 text-indigo-600"
                onClick={() => setIsSaveLayoutModalOpen(true)}
              >
                <Save size={16} />
                <span>SAVED LAYOUTS</span>
              </button>
              
              <div className="mt-2 space-y-2">
                {savedLayouts.map((layout, index) => (
                  <div key={index} className="flex items-center

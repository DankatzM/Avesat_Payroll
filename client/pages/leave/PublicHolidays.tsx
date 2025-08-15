import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  AlertTriangle,
  MapPin,
  Globe,
  Download,
  Upload,
  RefreshCw,
  Flag,
  Clock,
  Copy,
  Search
} from 'lucide-react';
import { UserRole } from '@shared/api';

// Interfaces
interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  year: number;
  description?: string;
  type: 'fixed' | 'variable' | 'observance';
  category: 'national' | 'religious' | 'cultural' | 'international';
  isOptional: boolean;
  isRecurring: boolean;
  region?: string;
  alternativeDate?: string;
  workingDayReplacement?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface HolidayTemplate {
  id: string;
  name: string;
  description: string;
  country: string;
  holidays: Omit<PublicHoliday, 'id' | 'year' | 'createdAt' | 'updatedAt' | 'createdBy'>[];
}

interface WorkingDayAdjustment {
  holidayId: string;
  originalDate: string;
  adjustedDate: string;
  reason: string;
  affectedDepartments?: string[];
}

const PublicHolidays: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // Access control
  const canManageHolidays = hasAnyRole([UserRole.HR_MANAGER, UserRole.ADMIN]);

  // State management
  const [activeTab, setActiveTab] = useState('holidays');
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [holidayTemplates, setHolidayTemplates] = useState<HolidayTemplate[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<PublicHoliday[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<PublicHoliday | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [newHoliday, setNewHoliday] = useState<Partial<PublicHoliday>>({
    name: '',
    date: '',
    description: '',
    type: 'fixed',
    category: 'national',
    isOptional: false,
    isRecurring: true,
    workingDayReplacement: false
  });

  // Mock data
  const mockPublicHolidays: PublicHoliday[] = [
    {
      id: 'ny_2025',
      name: 'New Year\'s Day',
      date: '2025-01-01',
      year: 2025,
      description: 'Public holiday to celebrate the new year',
      type: 'fixed',
      category: 'national',
      isOptional: false,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'gf_2025',
      name: 'Good Friday',
      date: '2025-04-18',
      year: 2025,
      description: 'Christian holiday commemorating the crucifixion of Jesus',
      type: 'variable',
      category: 'religious',
      isOptional: false,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'em_2025',
      name: 'Easter Monday',
      date: '2025-04-21',
      year: 2025,
      description: 'Christian holiday following Easter Sunday',
      type: 'variable',
      category: 'religious',
      isOptional: false,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'ld_2025',
      name: 'Labour Day',
      date: '2025-05-01',
      year: 2025,
      description: 'International Workers\' Day',
      type: 'fixed',
      category: 'international',
      isOptional: false,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'md_2025',
      name: 'Madaraka Day',
      date: '2025-06-01',
      year: 2025,
      description: 'Commemorates the day Kenya attained internal self-rule',
      type: 'fixed',
      category: 'national',
      isOptional: false,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'hh_2025',
      name: 'Huduma Day',
      date: '2025-10-10',
      year: 2025,
      description: 'Day to celebrate public service',
      type: 'fixed',
      category: 'national',
      isOptional: false,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'mh_2025',
      name: 'Mashujaa Day',
      date: '2025-10-20',
      year: 2025,
      description: 'Heroes\' Day to honour those who contributed to Kenya\'s struggle for independence',
      type: 'fixed',
      category: 'national',
      isOptional: false,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'id_2025',
      name: 'Independence Day',
      date: '2025-12-12',
      year: 2025,
      description: 'Commemorates Kenya\'s independence from British colonial rule',
      type: 'fixed',
      category: 'national',
      isOptional: false,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'cd_2025',
      name: 'Christmas Day',
      date: '2025-12-25',
      year: 2025,
      description: 'Christian holiday celebrating the birth of Jesus Christ',
      type: 'fixed',
      category: 'religious',
      isOptional: false,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'bd_2025',
      name: 'Boxing Day',
      date: '2025-12-26',
      year: 2025,
      description: 'Public holiday following Christmas Day',
      type: 'fixed',
      category: 'national',
      isOptional: false,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 'wd_2025',
      name: 'Women\'s Day',
      date: '2025-03-08',
      year: 2025,
      description: 'International Women\'s Day celebration',
      type: 'fixed',
      category: 'international',
      isOptional: true,
      isRecurring: true,
      workingDayReplacement: false,
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      createdBy: 'admin'
    }
  ];

  const mockHolidayTemplates: HolidayTemplate[] = [
    {
      id: 'kenya_template',
      name: 'Kenya Public Holidays',
      description: 'Standard Kenyan public holidays as per government gazette',
      country: 'Kenya',
      holidays: [
        {
          name: 'New Year\'s Day',
          date: '01-01',
          description: 'Public holiday to celebrate the new year',
          type: 'fixed',
          category: 'national',
          isOptional: false,
          isRecurring: true,
          workingDayReplacement: false
        },
        {
          name: 'Labour Day',
          date: '05-01',
          description: 'International Workers\' Day',
          type: 'fixed',
          category: 'international',
          isOptional: false,
          isRecurring: true,
          workingDayReplacement: false
        }
      ]
    }
  ];

  // Initialize data
  useEffect(() => {
    setPublicHolidays(mockPublicHolidays);
    setHolidayTemplates(mockHolidayTemplates);
  }, []);

  // Filter holidays
  useEffect(() => {
    let filtered = publicHolidays.filter(holiday => holiday.year === selectedYear);

    if (searchTerm) {
      filtered = filtered.filter(holiday =>
        holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        holiday.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(holiday => holiday.category === categoryFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(holiday => holiday.type === typeFilter);
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setFilteredHolidays(filtered);
  }, [publicHolidays, selectedYear, searchTerm, categoryFilter, typeFilter]);

  // Handle create holiday
  const handleCreateHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      alert('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    try {
      const holiday: PublicHoliday = {
        id: `holiday_${Date.now()}`,
        ...newHoliday as PublicHoliday,
        year: new Date(newHoliday.date!).getFullYear(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.id || 'system'
      };

      setPublicHolidays([...publicHolidays, holiday]);
      setShowCreateDialog(false);
      setNewHoliday({
        name: '',
        date: '',
        description: '',
        type: 'fixed',
        category: 'national',
        isOptional: false,
        isRecurring: true,
        workingDayReplacement: false
      });

      alert('Holiday created successfully!');
    } catch (error) {
      alert('Error creating holiday. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate holidays for next year
  const generateHolidaysForNextYear = () => {
    const nextYear = selectedYear + 1;
    const recurringHolidays = publicHolidays.filter(h => h.isRecurring && h.year === selectedYear);
    
    const newHolidays = recurringHolidays.map(holiday => ({
      ...holiday,
      id: `${holiday.id.replace(holiday.year.toString(), '')}_${nextYear}`,
      date: holiday.date.replace(holiday.year.toString(), nextYear.toString()),
      year: nextYear,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    setPublicHolidays([...publicHolidays, ...newHolidays]);
    alert(`Generated ${newHolidays.length} holidays for ${nextYear}`);
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'national': return 'bg-blue-100 text-blue-800';
      case 'religious': return 'bg-purple-100 text-purple-800';
      case 'cultural': return 'bg-green-100 text-green-800';
      case 'international': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fixed': return 'bg-green-100 text-green-800';
      case 'variable': return 'bg-yellow-100 text-yellow-800';
      case 'observance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get day of week
  const getDayOfWeek = (date: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(date).getDay()];
  };

  // Access control check
  if (!canManageHolidays) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access Denied – You do not have permission to manage public holidays.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Public Holidays</h1>
          <p className="text-gray-600">Manage public holidays and working day adjustments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateHolidaysForNextYear}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate Next Year
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Holiday
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="adjustments">Working Day Adjustments</TabsTrigger>
        </TabsList>

        {/* Holidays Tab */}
        <TabsContent value="holidays" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(Number(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search holidays..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="religious">Religious</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                      <SelectItem value="observance">Observance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holidays Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holiday Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Optional</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHolidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{holiday.name}</div>
                          {holiday.description && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {holiday.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {new Date(holiday.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getDayOfWeek(holiday.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(holiday.type)}>
                          {holiday.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(holiday.category)}>
                          {holiday.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={holiday.isOptional ? "secondary" : "default"}>
                          {holiday.isOptional ? 'Optional' : 'Mandatory'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedHoliday(holiday)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedHoliday(holiday);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Holiday Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredHolidays.length}
                </div>
                <div className="text-sm text-blue-600">Total Holidays</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredHolidays.filter(h => !h.isOptional).length}
                </div>
                <div className="text-sm text-green-600">Mandatory</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredHolidays.filter(h => h.isOptional).length}
                </div>
                <div className="text-sm text-orange-600">Optional</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredHolidays.filter(h => ['saturday', 'sunday'].includes(getDayOfWeek(h.date).toLowerCase())).length}
                </div>
                <div className="text-sm text-purple-600">On Weekends</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calendar View Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Holiday Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
                <p className="text-gray-600">Interactive calendar showing all public holidays</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Holiday Templates</CardTitle>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {holidayTemplates.map((template) => (
                  <Card key={template.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Flag className="w-4 h-4 text-blue-600" />
                            <h3 className="font-semibold">{template.name}</h3>
                            <Badge variant="outline">{template.country}</Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{template.description}</p>
                          <div className="text-sm text-gray-500">
                            {template.holidays.length} holidays defined
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            Apply to {selectedYear}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Day Adjustments Tab */}
        <TabsContent value="adjustments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Working Day Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Working Day Adjustments</h3>
                <p className="text-gray-600">Manage compensatory working days and holiday adjustments</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Holiday Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Holiday</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Holiday Name</Label>
              <Input
                id="name"
                value={newHoliday.name || ''}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Independence Day"
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newHoliday.date || ''}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newHoliday.description || ''}
                onChange={(e) => setNewHoliday(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the holiday"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newHoliday.type}
                  onValueChange={(value) => setNewHoliday(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                    <SelectItem value="observance">Observance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newHoliday.category}
                  onValueChange={(value) => setNewHoliday(prev => ({ ...prev, category: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="religious">Religious</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isOptional"
                  checked={newHoliday.isOptional}
                  onCheckedChange={(checked) => setNewHoliday(prev => ({ ...prev, isOptional: checked }))}
                />
                <Label htmlFor="isOptional">Optional Holiday</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isRecurring"
                  checked={newHoliday.isRecurring}
                  onCheckedChange={(checked) => setNewHoliday(prev => ({ ...prev, isRecurring: checked }))}
                />
                <Label htmlFor="isRecurring">Recurring Holiday</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="workingDayReplacement"
                  checked={newHoliday.workingDayReplacement}
                  onCheckedChange={(checked) => setNewHoliday(prev => ({ ...prev, workingDayReplacement: checked }))}
                />
                <Label htmlFor="workingDayReplacement">Replace with Working Day</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateHoliday} disabled={isSaving}>
                {isSaving ? 'Creating...' : 'Create Holiday'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Holiday Dialog */}
      <Dialog open={!!selectedHoliday && !showEditDialog} onOpenChange={() => setSelectedHoliday(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Holiday Details</DialogTitle>
          </DialogHeader>
          {selectedHoliday && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <div className="font-medium">{selectedHoliday.name}</div>
                </div>
                <div>
                  <Label>Date</Label>
                  <div className="font-medium">
                    {new Date(selectedHoliday.date).toLocaleDateString()} ({getDayOfWeek(selectedHoliday.date)})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Badge className={getTypeColor(selectedHoliday.type)}>
                    {selectedHoliday.type}
                  </Badge>
                </div>
                <div>
                  <Label>Category</Label>
                  <Badge className={getCategoryColor(selectedHoliday.category)}>
                    {selectedHoliday.category}
                  </Badge>
                </div>
              </div>

              {selectedHoliday.description && (
                <div>
                  <Label>Description</Label>
                  <div className="p-3 bg-gray-50 rounded">{selectedHoliday.description}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Optional</Label>
                  <div className="font-medium">{selectedHoliday.isOptional ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <Label>Recurring</Label>
                  <div className="font-medium">{selectedHoliday.isRecurring ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicHolidays;

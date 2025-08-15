import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  Download,
  Settings,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin,
  User
} from 'lucide-react';
import { UserRole, LeaveType, LeaveStatus } from '@shared/api';

// Interfaces
interface CalendarEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  isHalfDay?: boolean;
  notes?: string;
}

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  description?: string;
  isOptional: boolean;
  region?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holiday?: PublicHoliday;
  events: CalendarEvent[];
}

const LeaveCalendar: React.FC = () => {
  const { user, hasAnyRole } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Mock data
  const mockPublicHolidays: PublicHoliday[] = [
    {
      id: 'ny_2025',
      name: 'New Year\'s Day',
      date: '2025-01-01',
      description: 'Public holiday to celebrate the new year',
      isOptional: false
    },
    {
      id: 'gf_2025',
      name: 'Good Friday',
      date: '2025-04-18',
      description: 'Christian holiday commemorating the crucifixion of Jesus',
      isOptional: false
    },
    {
      id: 'em_2025',
      name: 'Easter Monday',
      date: '2025-04-21',
      description: 'Christian holiday following Easter Sunday',
      isOptional: false
    },
    {
      id: 'ld_2025',
      name: 'Labour Day',
      date: '2025-05-01',
      description: 'International Workers\' Day',
      isOptional: false
    },
    {
      id: 'md_2025',
      name: 'Madaraka Day',
      date: '2025-06-01',
      description: 'Commemorates the day Kenya attained internal self-rule',
      isOptional: false
    },
    {
      id: 'hh_2025',
      name: 'Huduma Day',
      date: '2025-10-10',
      description: 'Day to celebrate public service',
      isOptional: false
    },
    {
      id: 'mh_2025',
      name: 'Mashujaa Day',
      date: '2025-10-20',
      description: 'Heroes\' Day to honour those who contributed to Kenya\'s struggle for independence',
      isOptional: false
    },
    {
      id: 'id_2025',
      name: 'Independence Day',
      date: '2025-12-12',
      description: 'Commemorates Kenya\'s independence from British colonial rule',
      isOptional: false
    },
    {
      id: 'cd_2025',
      name: 'Christmas Day',
      date: '2025-12-25',
      description: 'Christian holiday celebrating the birth of Jesus Christ',
      isOptional: false
    },
    {
      id: 'bd_2025',
      name: 'Boxing Day',
      date: '2025-12-26',
      description: 'Public holiday following Christmas Day',
      isOptional: false
    }
  ];

  const mockCalendarEvents: CalendarEvent[] = [
    {
      id: 'event_001',
      employeeId: 'emp_001',
      employeeName: 'John Mwangi',
      employeeNumber: 'EMP001',
      department: 'Finance',
      leaveType: LeaveType.ANNUAL,
      startDate: '2025-02-15',
      endDate: '2025-02-19',
      status: LeaveStatus.APPROVED
    },
    {
      id: 'event_002',
      employeeId: 'emp_002',
      employeeName: 'Grace Wanjiku',
      employeeNumber: 'EMP002',
      department: 'HR',
      leaveType: LeaveType.SICK,
      startDate: '2025-01-25',
      endDate: '2025-01-25',
      status: LeaveStatus.APPROVED,
      isHalfDay: true
    },
    {
      id: 'event_003',
      employeeId: 'emp_003',
      employeeName: 'Peter Kiprotich',
      employeeNumber: 'EMP003',
      department: 'IT',
      leaveType: LeaveType.ANNUAL,
      startDate: '2025-03-10',
      endDate: '2025-03-14',
      status: LeaveStatus.PENDING
    },
    {
      id: 'event_004',
      employeeId: 'emp_004',
      employeeName: 'Mary Achieng',
      employeeNumber: 'EMP004',
      department: 'Sales',
      leaveType: LeaveType.MATERNITY,
      startDate: '2025-02-01',
      endDate: '2025-04-30',
      status: LeaveStatus.APPROVED
    }
  ];

  // Initialize data
  useEffect(() => {
    setCalendarEvents(mockCalendarEvents);
    setPublicHolidays(mockPublicHolidays);
  }, []);

  // Generate calendar days
  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, calendarEvents, publicHolidays]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of the month and how many days to show before it
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    // Generate 42 days (6 weeks) for calendar grid
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      // Check for holidays
      const dateStr = date.toISOString().split('T')[0];
      const holiday = publicHolidays.find(h => h.date === dateStr);
      const isHoliday = !!holiday;
      
      // Get events for this date
      const events = calendarEvents.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return date >= eventStart && date <= eventEnd;
      });
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        isWeekend,
        isHoliday,
        holiday,
        events: events.filter(event => {
          // Apply filters
          if (departmentFilter !== 'all' && event.department !== departmentFilter) return false;
          if (leaveTypeFilter !== 'all' && event.leaveType !== leaveTypeFilter) return false;
          if (statusFilter !== 'all' && event.status !== statusFilter) return false;
          return true;
        })
      });
    }
    
    setCalendarDays(days);
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get leave type color
  const getLeaveTypeColor = (type: LeaveType) => {
    switch (type) {
      case LeaveType.ANNUAL: return 'bg-blue-500';
      case LeaveType.SICK: return 'bg-red-500';
      case LeaveType.MATERNITY: return 'bg-pink-500';
      case LeaveType.PATERNITY: return 'bg-green-500';
      case LeaveType.COMPASSIONATE: return 'bg-purple-500';
      case LeaveType.STUDY: return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  // Get status color
  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED: return 'border-green-500 bg-green-50';
      case LeaveStatus.PENDING: return 'border-yellow-500 bg-yellow-50';
      case LeaveStatus.REJECTED: return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Calendar</h1>
          <p className="text-gray-600">Organization-wide leave calendar and planning</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="conflicts">Conflict Analysis</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-xl font-semibold min-w-48 text-center">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Leave Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value={LeaveType.ANNUAL}>Annual</SelectItem>
                      <SelectItem value={LeaveType.SICK}>Sick</SelectItem>
                      <SelectItem value={LeaveType.MATERNITY}>Maternity</SelectItem>
                      <SelectItem value={LeaveType.PATERNITY}>Paternity</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value={LeaveStatus.APPROVED}>Approved</SelectItem>
                      <SelectItem value={LeaveStatus.PENDING}>Pending</SelectItem>
                      <SelectItem value={LeaveStatus.REJECTED}>Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Grid */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-b">
                {dayNames.map((day) => (
                  <div key={day} className="p-4 text-center font-medium text-gray-700 border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-32 border-r border-b last:border-r-0 p-2 cursor-pointer hover:bg-gray-50 ${
                      !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                    } ${day.isToday ? 'bg-blue-50 border-blue-200' : ''} ${
                      day.isWeekend ? 'bg-gray-100' : ''
                    } ${day.isHoliday ? 'bg-red-50' : ''}`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        day.isToday ? 'text-blue-600' : ''
                      } ${day.isHoliday ? 'text-red-600' : ''}`}>
                        {day.date.getDate()}
                      </span>
                      {day.events.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {day.events.length}
                        </Badge>
                      )}
                    </div>
                    
                    {day.isHoliday && day.holiday && (
                      <div className="text-xs text-red-600 font-medium mb-1 truncate" title={day.holiday.name}>
                        {day.holiday.name}
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      {day.events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded border-l-2 ${getLeaveTypeColor(event.leaveType)} ${getStatusColor(event.status)} cursor-pointer`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          title={`${event.employeeName} - ${event.leaveType.replace('_', ' ')}`}
                        >
                          <div className="font-medium truncate">{event.employeeName}</div>
                          <div className="truncate">{event.leaveType.replace('_', ' ')}</div>
                        </div>
                      ))}
                      {day.events.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{day.events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Leave Types</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm">Annual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-sm">Sick</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-pink-500 rounded"></div>
                      <span className="text-sm">Maternity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">Paternity</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-green-500 bg-green-50 rounded"></div>
                      <span className="text-sm">Approved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-yellow-500 bg-yellow-50 rounded"></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-red-500 bg-red-50 rounded"></div>
                      <span className="text-sm">Rejected</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Special Days</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                      <span className="text-sm">Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-50 rounded"></div>
                      <span className="text-sm">Public Holiday</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-100 rounded"></div>
                      <span className="text-sm">Weekend</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline View</h3>
                <p className="text-gray-600">Detailed timeline view of leave schedules</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflict Analysis */}
        <TabsContent value="conflicts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave Conflict Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Conflict Detection</h3>
                <p className="text-gray-600">Identify potential conflicts in leave schedules</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <div className="font-medium">{selectedEvent.employeeName}</div>
                  <div className="text-sm text-gray-500">{selectedEvent.employeeNumber}</div>
                </div>
                <div>
                  <Label>Department</Label>
                  <div className="font-medium">{selectedEvent.department}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Leave Type</Label>
                  <Badge className={`${getLeaveTypeColor(selectedEvent.leaveType)} text-white`}>
                    {selectedEvent.leaveType.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedEvent.status)}>
                    {selectedEvent.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <div className="font-medium">
                    {new Date(selectedEvent.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label>End Date</Label>
                  <div className="font-medium">
                    {new Date(selectedEvent.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {selectedEvent.isHalfDay && (
                <div>
                  <Label>Duration</Label>
                  <Badge variant="outline">Half Day</Badge>
                </div>
              )}

              {selectedEvent.notes && (
                <div>
                  <Label>Notes</Label>
                  <div className="p-3 bg-gray-50 rounded">{selectedEvent.notes}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveCalendar;

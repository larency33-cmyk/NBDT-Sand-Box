
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Menu,
  AlertCircle,
  Plus, 
  Copy, 
  Database, 
  Trash2, 
  ChevronRight, 
  Sparkles,
  X,
  Ship,
  Calendar,
  Box,
Navigation,
  ChevronLeft,
  Flag,
  Save,
  UserPlus,
  Edit2,
  Cloud,
  Download,
  Upload,
  Search,
  RefreshCw,
  History,
  CheckCircle2,
  Check,
  Square,
  CheckSquare,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Network,
  User,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  Layers,
  Terminal,
  Globe,
  Settings,
  Cpu,
  Rocket,
  Wifi,
  WifiOff,
  Keyboard,
  Zap,
  Lock,
  Cable,
  ArrowRight,
  HardDrive,
  ClipboardList,
  ClipboardCheck,
  FileText,
  Layout,
  Filter,
  Tag,
  Hash,
  AppWindow,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronDown,
  MoreVertical,
  Edit3,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FileBarChart
} from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCz3vU3nLXjmC_qUeuJCYg8H8nXTpxJoJE",
  authDomain: "nbdt-bf1e2.firebaseapp.com",
  databaseURL: "https://nbdt-bf1e2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "nbdt-bf1e2",
  storageBucket: "nbdt-bf1e2.firebasestorage.app",
  messagingSenderId: "822830436377",
  appId: "1:822830436377:web:61c14daa4a8919f38d5a88"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Types ---
type SystemStatus = 'Active' | 'Limited' | 'Pilot' | 'Legacy';
type TaskStatus = 'Planned' | 'In Progress' | 'Blocked' | 'Completed';
type DeviceCategory = 'PC' | 'Laptop' | 'Tablet' | 'Phone' | 'Kiosk';
type OSType = 'Windows' | 'Linux' | 'iOS' | 'Android' | 'Other';
type IssueSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
type IssueStatus = 'Open' | 'Investigating' | 'Waiting for Parts' | 'Resolved';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface RoadmapTask {
  id: string;
  label: string;
  category?: string;
  startWeek: number;
  duration: number;
  status: TaskStatus;
  description: string;
  memberId: string;
  isMilestone?: boolean;
  date?: string; // specific date ISO string (YYYY-MM-DD) for milestones
  checklist?: ChecklistItem[];
  engineers?: string;
}

interface NDBTMember {
  id: string;
  name: string;
  isLead?: boolean;
  isTeamLead?: boolean;
}

interface CheckSheetItem {
  id: string;
  label: string;
  completed: boolean;
}

interface CheckSheetData {
  configuration: CheckSheetItem[];
  deployment: CheckSheetItem[];
  readyForDeployment: CheckSheetItem[];
}

interface SystemInfo {
  id: string;
  name: string;
  deviceType: string;      
  deviceCategory: DeviceCategory;
  os: OSType;
  osVersion: string;       
  network: string;         
  vlan: string;            
  serviceAccount: string;  
  userAccount: string;     
  logonType: string;       
  ipScope: string;
  ipReservation: string;
  domainOU: string;
  airWatchTags: string;
  status: SystemStatus;
  assigneeId?: string;
  documentation?: string;
  checkSheet?: string;
  checkSheetData?: CheckSheetData;
  appList?: string;
  namingConvention?: string;
  lessonsLearned?: string;
}

interface Issue {
  id: string;
  systemId: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  assigneeId?: string;
  createdAt: number;
  updatedAt: number;
}

interface ProjectMeta {
  id: string;
  name: string;
}

interface UserProject {
  id: string;
  name: string;
  status?: 'Active' | 'In Progress' | 'Planned' | 'Blocked';
  date?: string;
  projectManager?: string;
  engineers?: string;
}

interface ConfigReportRow {
  id: string;
  bc: 'green' | 'orange' | 'red' | 'none';
  rd: 'green' | 'orange' | 'red' | 'none';
  system: string;
  qti: number;
  venue: string;
  device: string;
  bcDone: number;
  rdDone: number;
  aw: 'green' | 'orange' | 'red' | 'none';
  cyber: 'Approved' | 'Review' | 'Blocked' | 'N/A';
  assignee: string;
  active?: boolean;
}

interface ProjectData {
  id: string;
  name: string;
  tasks: RoadmapTask[];
  members: NDBTMember[];
  systems: SystemInfo[];
  issues: Issue[];
  configReportRows?: ConfigReportRow[];
  startDate: string;
  updatedAt: number;
}

// --- Constants ---
const TOTAL_WEEKS = 28;
const WEEK_WIDTH = 200; 
const MEMBER_LABEL_WIDTH = 220; 

const DEFAULT_CHECKSHEET: CheckSheetData = {
  configuration: [
    { id: 'c1', label: 'BIOS Password Set', completed: false },
    { id: 'c2', label: 'UEFI Secure Boot Enabled', completed: false },
    { id: 'c3', label: 'TPM 2.0 Provisioned', completed: false },
    { id: 'c4', label: 'Asset Tag Applied', completed: false },
    { id: 'c5', label: 'Domain Join Verified', completed: false }
  ],
  deployment: [
    { id: 'd1', label: 'Hardware Integrity Check', completed: false },
    { id: 'd2', label: 'OS Update Verification', completed: false },
    { id: 'd3', label: 'Network Segregation (VLAN 500)', completed: false },
    { id: 'd4', label: 'Security Protocol Audit', completed: false },
    { id: 'd5', label: 'Backup Configuration', completed: false },
    { id: 'd6', label: 'End-User Access Control', completed: false }
  ],
  readyForDeployment: [
    { id: 'r1', label: 'Final Quality Check', completed: false },
    { id: 'r2', label: 'Documentation Complete', completed: false },
    { id: 'r3', label: 'Labeling Verified', completed: false }
  ]
};

// --- Initial Data ---
const INITIAL_CONFIG_REPORT_ROWS: ConfigReportRow[] = [
  { id: '1', bc: 'green', rd: 'green', system: 'POS', qti: 237, venue: 'Venue 1', device: 'NINO III', bcDone: 147, rdDone: 130, aw: 'green', cyber: 'Review', assignee: 'Marin' },
  { id: '2', bc: 'green', rd: 'orange', system: 'SystemName', qti: 3, venue: 'Venue 2', device: 'Device Name', bcDone: 1, rdDone: 1, aw: 'green', cyber: 'Review', assignee: 'Melin' },
  { id: '3', bc: 'green', rd: 'red', system: 'SystemName', qti: 3, venue: 'Venue 3', device: 'Device Name', bcDone: 0, rdDone: 1, aw: 'green', cyber: 'Review', assignee: 'Mars', active: true },
  { id: '4', bc: 'green', rd: 'orange', system: 'SystemName', qti: 3, venue: 'Venue 4', device: 'Device Name', bcDone: 1, rdDone: 1, aw: 'green', cyber: 'Review', assignee: 'Natte' },
  { id: '5', bc: 'green', rd: 'orange', system: 'SystemName', qti: 3, venue: 'Venue 5', device: 'Device Name', bcDone: 1, rdDone: 1, aw: 'green', cyber: 'Review', assignee: 'Jaren' },
  { id: '6', bc: 'green', rd: 'orange', system: 'SystemName', qti: 3, venue: 'Venue 8', device: 'Device Name', bcDone: 1, rdDone: 1, aw: 'green', cyber: 'Review', assignee: 'Mather' },
  { id: '7', bc: 'green', rd: 'orange', system: 'SystemName', qti: 3, venue: 'Venue 4', device: 'Device Name', bcDone: 2, rdDone: 1, aw: 'green', cyber: 'Review', assignee: 'Junin' },
  { id: '8', bc: 'green', rd: 'red', system: 'SystemName', qti: 3, venue: 'Venue 5', device: 'Device Name', bcDone: 1, rdDone: 1, aw: 'green', cyber: 'Review', assignee: 'Marin' },
  { id: '9', bc: 'green', rd: 'red', system: 'SystemName', qti: 3, venue: 'Venue 4', device: 'Device Name', bcDone: 1, rdDone: 1, aw: 'green', cyber: 'Review', assignee: 'Maria' },
];

const INITIAL_MEMBERS: NDBTMember[] = [
  { id: 'm0', name: 'TEAM LEAD', isLead: true, isTeamLead: true },
  { id: 'm1', name: 'HOMESH', isLead: true },
  { id: 'm2', name: 'JORGE', isLead: true },
  { id: 'm3', name: 'APPLE / NILSON', isLead: true },
  { id: 'm4', name: 'ELVAN', isLead: true },
  { id: 'm5', name: 'RONNY', isLead: true },
  { id: 'm6', name: 'NISHANT', isLead: true },
  { id: 'm7', name: 'NADEEM', isLead: true },
  { id: 'm8', name: 'ROB', isLead: true },
  { id: 'm9', name: 'DODY', isLead: true },
  { id: 'm10', name: 'DARON', isLead: true },
  { id: 'm11', name: 'CLAUDIO', isLead: true },
];

const MOCK_USER_PROJECTS: Record<string, UserProject[]> = {
  'm0': [
    { id: 'p0-1', name: 'Global Infrastructure Upgrade', status: 'Active', date: '2026-06-30' },
    { id: 'p0-2', name: 'Security Protocol V2', status: 'In Progress', date: '2026-08-15' },
  ],
  'm1': [
    { id: 'p1-1', name: 'Cloud Migration Phase 1', status: 'Active', date: '2026-04-15' },
    { id: 'p1-2', name: 'Database Optimization', status: 'In Progress', date: '2026-05-20' },
    { id: 'p1-3', name: 'API Gateway Refactoring', status: 'Planned', date: '2026-07-10' },
  ],
  'm2': [
    { id: 'p2-1', name: 'Mobile App Redesign', status: 'In Progress', date: '2026-05-01' },
    { id: 'p2-2', name: 'Push Notification Service', status: 'Active', date: '2026-04-25' },
  ],
  'm3': [
    { id: 'p3-1', name: 'Frontend Component Library', status: 'Active', date: '2026-06-01' },
    { id: 'p3-2', name: 'Accessibility Audit', status: 'Planned', date: '2026-09-15' },
  ],
  'm4': [
    { id: 'p4-1', name: 'Backend Scalability Study', status: 'Blocked', date: '2026-03-30' },
    { id: 'p4-2', name: 'Microservices Orchestration', status: 'In Progress', date: '2026-05-15' },
  ],
  'm5': [
    { id: 'p5-1', name: 'Data Warehouse Setup', status: 'Active', date: '2026-07-01' },
    { id: 'p5-2', name: 'ETL Pipeline Automation', status: 'In Progress', date: '2026-08-20' },
  ],
  'm6': [
    { id: 'p6-1', name: 'Machine Learning Model Training', status: 'Active', date: '2026-10-15' },
    { id: 'p6-2', name: 'Predictive Analytics Dashboard', status: 'Planned', date: '2026-12-01' },
  ],
  'm7': [
    { id: 'p7-1', name: 'DevOps Pipeline Hardening', status: 'Active', date: '2026-04-10' },
    { id: 'p7-2', name: 'Kubernetes Cluster Migration', status: 'In Progress', date: '2026-06-15' },
  ],
  'm8': [
    { id: 'p8-1', name: 'Customer Support Portal', status: 'Active', date: '2026-05-20' },
    { id: 'p8-2', name: 'Live Chat Integration', status: 'Planned', date: '2026-07-05' },
  ],
  'm9': [
    { id: 'p9-1', name: 'Internal Tooling Suite', status: 'Active', date: '2026-04-30' },
    { id: 'p9-2', name: 'Employee Onboarding Flow', status: 'In Progress', date: '2026-05-15' },
  ],
  'm10': [
    { id: 'p10-1', name: 'Marketing Automation Platform', status: 'Active', date: '2026-06-15' },
    { id: 'p10-2', name: 'SEO Optimization Engine', status: 'Planned', date: '2026-08-01' },
  ],
  'm11': [
    { id: 'p11-1', name: 'Billing System Overhaul', status: 'Blocked', date: '2026-04-01' },
    { id: 'p11-2', name: 'Payment Gateway Integration', status: 'In Progress', date: '2026-05-30' },
  ],
};

const INITIAL_SYSTEMS: SystemInfo[] = [
  {
    id: 'sys-demo-1',
    name: 'CREW DEBIT KIOSK',
    deviceType: 'Nino III',
    deviceCategory: 'Kiosk',
    os: 'Windows',
    osVersion: '10 • 21H2 LTSC',
    network: 'Wired',
    vlan: '500',
    serviceAccount: 'N/A',
    userAccount: 'POSUSER (268)',
    logonType: 'Autologon',
    ipScope: '10.20.50.0/24',
    ipReservation: '10.20.50.15',
    domainOU: 'OU=POS,OU=Systems,DC=hub,DC=local',
    airWatchTags: 'POS_W10_LTSC',
    status: 'Active',
    assigneeId: 'lead-01',
    documentation: 'Main guest-facing transaction terminals.',
    checkSheetData: {
      configuration: [
        { id: 'c1', label: 'BIOS Password Set', completed: true },
        { id: 'c2', label: 'UEFI Secure Boot Enabled', completed: true },
        { id: 'c3', label: 'TPM 2.0 Provisioned', completed: false },
        { id: 'c4', label: 'Asset Tag Applied', completed: true }
      ],
      deployment: [
        { id: 'd1', label: 'Hardware Integrity Check', completed: false },
        { id: 'd2', label: 'OS Update Verification', completed: false },
        { id: 'd3', label: 'Network Segregation (VLAN 500)', completed: false },
        { id: 'd4', label: 'Security Protocol Audit', completed: false }
      ],
      readyForDeployment: [
        { id: 'r1', label: 'Final Quality Check', completed: false },
        { id: 'r2', label: 'Documentation Complete', completed: false }
      ]
    },
    appList: 'MS Office, POS Client v4.2, CrowdStrike, TeamViewer',
    namingConvention: 'POS-HUB-[DEPT]-[NUM]'
  },
  {
    id: 'sys-demo-2',
    name: 'STATEROOM APP',
    deviceType: 'Hardware Unit',
    deviceCategory: 'Tablet',
    os: 'iOS',
    osVersion: '17.1',
    network: 'WiFi',
    vlan: '600',
    serviceAccount: 'Svc_Stateroom',
    userAccount: 'Crew_ID',
    logonType: 'MDM Login',
    ipScope: '10.20.60.0/24',
    ipReservation: 'DHCP Dynamic',
    domainOU: 'N/A (Workgroup)',
    airWatchTags: 'CREW_HANDHELD_IOS',
    status: 'Active',
    assigneeId: 'nbdt-01',
    documentation: 'Crew handhelds for stateroom management.',
    appList: 'Stateroom Service App, Browser, Internal Mail'
  }
];

const INITIAL_ISSUES: Issue[] = [
  {
    id: 'issue-1',
    systemId: 'sys-demo-1',
    title: 'Touchscreen Unresponsive',
    description: 'The lower left quadrant of the touchscreen is not responding to touch events.',
    severity: 'High',
    status: 'Investigating',
    assigneeId: 'nbdt-01',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000
  },
  {
    id: 'issue-2',
    systemId: 'sys-demo-2',
    title: 'App Crash on Startup',
    description: 'Stateroom app crashes immediately when opened on iOS 17.1 devices.',
    severity: 'Critical',
    status: 'Open',
    assigneeId: 'lead-01',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000
  }
];

// --- Helpers ---
/** 
 * Safely parse 'YYYY-MM-DD' as local date to avoid timezone shift 
 */
const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const getWeekRange = (startDateStr: string, weekIndex: number) => {
  const start = parseLocalDate(startDateStr);
  start.setDate(start.getDate() + (weekIndex * 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  return `${fmt(start)} - ${fmt(end)}`;
};

const getDateInputValue = (startDateStr: string, task: RoadmapTask) => {
  if (task.isMilestone && task.date) {
    return task.date;
  }
  const date = parseLocalDate(startDateStr);
  date.setDate(date.getDate() + (task.startWeek * 7));
  return date.toISOString().split('T')[0];
};

const getWeekFromDate = (startDateStr: string, dateStr: string) => {
  const start = parseLocalDate(startDateStr);
  const current = parseLocalDate(dateStr);
  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.floor(diffDays / 7));
};

const ensureProjectData = (data: any): ProjectData => {
  return {
    ...data,
    id: data.id || 'default',
    name: data.name || 'New Project',
    tasks: data.tasks || [],
    members: data.members || INITIAL_MEMBERS,
    systems: data.systems || INITIAL_SYSTEMS,
    issues: data.issues || INITIAL_ISSUES,
    configReportRows: data.configReportRows || INITIAL_CONFIG_REPORT_ROWS,
    startDate: data.startDate || '2026-01-05',
    updatedAt: data.updatedAt || 0
  };
};

// --- Icon System Implementation ---

const getOSIcon = (os: OSType, size = 24) => {
  const className = `w-${size/4} h-${size/4} shrink-0 transition-colors`;
  switch(os) {
    case 'Windows': 
      return (
        <svg viewBox="0 0 24 24" className={`${className} fill-blue-500`}>
          <path d="M0 3.449L9.75 2.1l.01 9.458-9.76.012V3.449zm9.749 9.664l.007 9.455-9.756-1.349v-8.106h9.749zM10.875 1.95L24 0v11.55l-13.125.01V1.95zm13.125 22.05L10.875 22.1v-9.358h13.125V24z"/>
        </svg>
      );
    case 'Linux': 
      return (
        <svg viewBox="0 0 24 24" className={`${className}`}>
          {/* Fedora Brim */}
          <path 
            d="M21.5 16.5C21.5 18 17.5 19.5 12 19.5C6.5 19.5 2.5 18 2.5 16.5C2.5 15.5 4.5 14.5 8 14C8.5 14 9 14 9.5 14C10.5 14 11.5 14 12 14C14.5 14 17 14.5 19.5 15C20.5 15.2 21.5 15.8 21.5 16.5Z" 
            fill="#EE0000" 
          />
          {/* Fedora Crown */}
          <path 
            d="M7 14C7 14 6.5 10 9 6C11 3 13 3 15 6C17.5 10 17 14 17 14L7 14Z" 
            fill="#EE0000" 
          />
          {/* Fedora Band */}
          <path 
            d="M7.1 12.5H16.9V14.5H7.1V12.5Z" 
            fill="#1A1A1A" 
          />
        </svg>
      );
    case 'iOS': 
      return (
        <svg viewBox="0 0 24 24" className={`${className} fill-slate-300`}>
          <path d="M17.05 20.28c-.98.95-2.05 1.88-3.08 1.88-.41 0-.64-.1-.97-.24-.31-.14-.71-.32-1.29-.32-.56 0-.97.18-1.28.31-.34.14-.59.25-1.01.25-1.01 0-2.11-.96-3.13-1.92-2.18-2.05-3.64-5.83-3.64-8.83 0-3.05 1.57-4.66 3.1-4.66.8 0 1.56.45 2.04.45.18 0 .42-.09.73-.24.51-.23 1.17-.53 2.13-.53.25 0 1.68.05 2.72 1.57-2.58 1.51-2.16 5.04.48 6.1-.73 1.83-1.7 3.55-2.8 4.57zM12.03 5.07c.02-.03.04-.07.05-.11.66-1.13 1.71-2.08 3.13-2.31.04 1.3-.48 2.65-1.29 3.59-.85.99-2.19 1.72-3.32 1.63.02-.28.1-.56.2-.8.36-.85.83-1.56 1.23-2z"/>
        </svg>
      );
    case 'Android':
      return (
        <svg viewBox="0 0 24 24" className={`${className} fill-emerald-500`}>
          <path d="M17.5 13c.828 0 1.5-.672 1.5-1.5S18.328 10 17.5 10s-1.5.672-1.5 1.5.672 1.5 1.5 1.5zm-11 0c.828 0 1.5-.672 1.5-1.5S7.328 10 6.5 10 5 10.672 5 11.5s.672 1.5 1.5 1.5zm11.5-4.32l1.66-2.88a.5.5 0 1 0-.86-.5l-1.69 2.94C15.8 7.48 13.98 7 12 7s-3.8.48-5.11 1.24L5.2 5.3a.5.5 0 1 0-.86.5L6 8.68A8.95 8.95 0 0 0 3 15h18a8.95 8.95 0 0 0-3-6.32z"/>
        </svg>
      );
    default: return <Ship size={size} className="text-slate-500" />;
  }
};

const getDeviceIcon = (cat: DeviceCategory, size = 32) => {
  const className = `text-indigo-400 group-hover:text-indigo-300 transition-colors`;
  switch(cat) {
    case 'PC': return <Monitor size={size} className={className} />;
    case 'Laptop': return <Laptop size={size} className={className} />;
    case 'Tablet': return <Tablet size={size} className={className} />;
    case 'Phone': return <Smartphone size={size} className={className} />;
    case 'Kiosk': 
      return (
        <svg viewBox="0 0 24 24" className={`w-${size/4} h-${size/4} fill-current ${className}`}>
          <path d="M4 3h16c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm0 2v14h16V5H4zm1 2h14v2H5V7zm0 4h3v3H5v-3zm5 0h3v3h-3v-3zm5 0h3v3h-3v-3zm-10 4h3v3H5v-3zm5 0h3v3h-3v-3zm5 0h3v3h-3v-3z"/>
        </svg>
      );
    default: return <HardDrive size={size} className={className} />;
  }
};

const getNetworkIcon = (network: string, size = 18) => {
  const lower = network.toLowerCase();
  if (lower.includes('wireless') || lower.includes('wi-fi') || lower.includes('wifi')) {
    return <Wifi size={size} className="text-indigo-400" />;
  }
  if (lower.includes('offline') || lower.includes('disconnect')) {
    return <WifiOff size={size} className="text-red-400" />;
  }
  return <Cable size={size} className="text-indigo-400" />;
};

const getLogonIcon = (type: string, size = 14) => {
  const lower = type.toLowerCase();
  if (lower.includes('auto')) return <Zap size={size} className="text-amber-400" />;
  if (lower.includes('manual') || lower.includes('keyboard')) return <Keyboard size={size} />;
  if (lower.includes('lock') || lower.includes('restrict')) return <Lock size={size} className="text-red-400" />;
  return <LogIn size={size} />;
};

// --- Check Sheet Components ---

const SortableItem = ({ 
  id, 
  item, 
  isAdmin, 
  onToggle, 
  onRemove,
  sectionColor
}: { 
  id: string, 
  item: CheckSheetItem, 
  isAdmin: boolean, 
  onToggle: () => void,
  onRemove: () => void,
  sectionColor: string,
  key?: React.Key
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
        item.completed 
        ? `bg-${sectionColor}-500/5 border-${sectionColor}-500/20 text-${sectionColor}-400` 
        : 'bg-slate-900/20 border-slate-800/40 text-slate-500 hover:border-slate-700/60'
      }`}
    >
      {isAdmin && (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-700 hover:text-slate-500 transition-colors shrink-0">
          <GripVertical size={12} />
        </div>
      )}
      
      <button 
        disabled={!isAdmin}
        onClick={onToggle}
        className="flex-1 flex items-center gap-2.5 text-left overflow-hidden py-0.5"
      >
        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0 ${
          item.completed ? `bg-${sectionColor}-500 border-${sectionColor}-500 text-slate-950` : 'border-slate-700'
        }`}>
          {item.completed && <CheckCircle2 size={10} strokeWidth={4} />}
        </div>
        <span className="text-[10px] font-bold tracking-tight truncate uppercase">{item.label}</span>
      </button>

      {isAdmin && (
        <button 
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-700 hover:text-red-400 transition-all shrink-0"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
};

const CheckSheetSection = ({ 
  title, 
  icon: Icon, 
  items, 
  section, 
  systemId, 
  isAdmin, 
  onToggle, 
  onRemove, 
  onReorder,
  onAdd,
  colorClass
}: {
  title: string,
  icon: any,
  items: CheckSheetItem[],
  section: keyof CheckSheetData,
  systemId: string,
  isAdmin: boolean,
  onToggle: (itemId: string) => void,
  onRemove: (itemId: string) => void,
  onReorder: (oldIndex: number, newIndex: number) => void,
  onAdd: (label: string) => void,
  colorClass: string
}) => {
  const [newItemLabel, setNewItemLabel] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  const handleExport = () => {
    const content = `${title.toUpperCase()}\n${'='.repeat(title.length)}\n\n` + 
      items.map(item => `[${item.completed ? 'X' : ' '}] ${item.label}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_Tasks.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/20 rounded-3xl border border-slate-800/40 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-slate-900/40">
        <div className="flex items-center gap-2.5">
          <Icon size={14} className={`text-${colorClass}-400`} />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
             <div 
                className={`h-full bg-${colorClass}-500 transition-all duration-500`} 
                style={{ width: `${(items.filter(i => i.completed).length / Math.max(1, items.length)) * 100}%` }}
             />
          </div>
          <span className={`text-[9px] font-black text-${colorClass}-400/70 uppercase tabular-nums`}>
            {items.filter(i => i.completed).length}/{items.length}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-1.5">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={items.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1">
              {items.map(item => (
                <SortableItem 
                  key={item.id}
                  id={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onToggle={() => onToggle(item.id)}
                  onRemove={() => onRemove(item.id)}
                  sectionColor={colorClass}
                />
              ))}
              {items.length === 0 && (
                <div className="py-8 flex flex-col items-center justify-center opacity-20">
                   <div className="w-8 h-8 rounded-full border border-dashed border-slate-500 mb-2" />
                   <span className="text-[8px] font-black uppercase tracking-widest">No Tasks</span>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="p-3 bg-slate-900/20 border-t border-slate-800/40 flex flex-col gap-2">
        {isAdmin && (
          <div className="relative group">
            <input 
              type="text"
              placeholder="Quick Add Task..."
              className="w-full bg-slate-900/40 border border-slate-800/60 rounded-lg pl-3 pr-10 py-2 text-[10px] font-bold text-slate-300 outline-none focus:border-indigo-500/40 focus:bg-slate-900/60 transition-all placeholder:text-slate-600 uppercase tracking-tight"
              value={newItemLabel}
              onChange={e => setNewItemLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newItemLabel.trim()) {
                  onAdd(newItemLabel);
                  setNewItemLabel('');
                }
              }}
            />
            <button 
              onClick={() => {
                if (newItemLabel.trim()) {
                  onAdd(newItemLabel);
                  setNewItemLabel('');
                }
              }}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-md transition-all flex items-center justify-center border border-indigo-500/20"
            >
              <Plus size={12} />
            </button>
          </div>
        )}
        
        <button 
          onClick={handleExport}
          disabled={items.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700/60 text-[9px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
        >
          <Download size={12} className="group-hover:translate-y-0.5 transition-transform" />
          Export List
        </button>
      </div>
    </div>
  );
};

// --- Configuration Report Components ---

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CircularProgress = ({ 
  percentage, 
  label, 
  color, 
  glowColor,
  total,
  completed,
  icon: Icon
}: { 
  percentage: number, 
  label: string, 
  color: string, 
  glowColor: string,
  total?: number,
  completed?: number,
  icon: any
}) => {
  const radius = 40;
  const stroke = 5;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex-1 flex items-center gap-6 p-5 bg-[#0f172a]/40 rounded-[1.5rem] border border-slate-800/40 backdrop-blur-xl relative group overflow-hidden shadow-2xl min-w-[340px] transition-all duration-500 hover:border-indigo-500/30 hover:bg-[#0f172a]/60">
      {/* Left Side: Progress Circle with Percentage */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg viewBox={`0 0 ${radius * 2} ${radius * 2}`} className="transform -rotate-90 w-20 h-20 drop-shadow-[0_0_8px_rgba(0,0,0,0.3)]">
          <circle
            stroke="rgba(30, 41, 59, 0.3)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "circOut" }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            filter={`url(#glow-${label.replace(/\s+/g, '-')})`}
          />
          <defs>
            <filter id={`glow-${label.replace(/\s+/g, '-')}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
           <span className="text-xl font-black text-white tracking-tighter tabular-nums leading-none">
             {Math.round(percentage)}<span className="text-[10px] text-slate-500 ml-0.5">%</span>
           </span>
        </div>

        {/* Dynamic Glow */}
        <div 
          className="absolute inset-0 rounded-full opacity-10 blur-xl transition-opacity group-hover:opacity-20 pointer-events-none"
          style={{ backgroundColor: glowColor }}
        />
      </div>

      {/* Right Side: Info & Stats */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50 shadow-inner group-hover:scale-110 transition-transform">
            <Icon size={14} style={{ color }} strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] truncate group-hover:text-slate-200 transition-colors">
            {label}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Completed</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white tabular-nums leading-none">{completed}</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Items</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-slate-800/60" />
          
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Scope</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-400 tabular-nums leading-none">{total}</span>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Total</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
    </div>
  );
};

const StatusDot = ({ status, onClick }: { status: 'green' | 'orange' | 'red' | 'none', onClick?: () => void }) => {
  const colors = {
    green: 'bg-emerald-500',
    orange: 'bg-amber-500',
    red: 'bg-rose-500',
    none: 'bg-slate-800'
  };
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 active:scale-95", 
        colors[status]
      )} 
    />
  );
};

const TableProgressBar = ({ done, total, color, onDoneChange }: { done: number, total: number, color: string, onDoneChange?: (val: number) => void }) => {
  const percentage = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  
  return (
    <div className="flex flex-col gap-2 min-w-[160px] group/progress">
      <div className="flex justify-between items-end px-0.5 mb-1">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">PROGRESS</span>
          <div className="flex items-center gap-1">
            <input 
              type="number" 
              value={done} 
              readOnly={!onDoneChange}
              onChange={(e) => onDoneChange?.(parseInt(e.target.value) || 0)}
              className={cn(
                "bg-slate-800/40 border border-slate-700/50 rounded px-1.5 py-0.5 text-[10px] font-black text-white w-12 outline-none transition-colors",
                onDoneChange ? "focus:border-indigo-500/50 cursor-text" : "cursor-default"
              )}
            />
            <span className="text-[10px] font-bold text-slate-600">/ {total}</span>
          </div>
        </div>
        <span className="text-[11px] font-black text-slate-300 tabular-nums leading-none">{percentage}%</span>
      </div>
      <div className="relative h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-800/30">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
};


interface ConfigurationReportProps {
  isAdmin: boolean;
  members: NDBTMember[];
  projectId: string;
  projectName: string;
  rows: ConfigReportRow[];
  onRowsChange: (rows: ConfigReportRow[]) => void;
}

const ConfigurationReport = ({ isAdmin, members, projectId, projectName, rows, onRowsChange }: ConfigurationReportProps) => {
  const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof ConfigReportRow, string>>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    setColumnFilters({});
    setSearch('');
  }, [projectId]);

  const updateRow = (id: string, field: keyof ConfigReportRow, value: any) => {
    if (!isAdmin) return;
    onRowsChange(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const cycleStatus = (id: string, field: 'bc' | 'rd' | 'aw') => {
    if (!isAdmin) return;
    const statuses: ('green' | 'orange' | 'red' | 'none')[] = ['green', 'orange', 'red', 'none'];
    onRowsChange(rows.map(row => {
      if (row.id === id) {
        const currentIdx = statuses.indexOf(row[field]);
        const nextIdx = (currentIdx + 1) % statuses.length;
        return { ...row, [field]: statuses[nextIdx] };
      }
      return row;
    }));
  };

  const cycleCyber = (id: string) => {
    if (!isAdmin) return;
    const statuses: ('Approved' | 'Review' | 'Blocked' | 'N/A')[] = ['Approved', 'Review', 'Blocked', 'N/A'];
    onRowsChange(rows.map(row => {
      if (row.id === id) {
        const currentIdx = statuses.indexOf(row.cyber);
        const nextIdx = (currentIdx + 1) % statuses.length;
        return { ...row, cyber: statuses[nextIdx] };
      }
      return row;
    }));
  };

  const addNewRow = () => {
    if (!isAdmin) return;
    const newRow: ConfigReportRow = {
      id: Date.now().toString(),
      bc: 'none',
      rd: 'none',
      system: 'New System',
      qti: 1,
      venue: 'Venue',
      device: 'Device',
      bcDone: 0,
      rdDone: 0,
      aw: 'none',
      cyber: 'Review',
      assignee: 'Unassigned'
    };
    onRowsChange([newRow, ...rows]);
  };

  const deleteRow = (id: string) => {
    onRowsChange(rows.filter(r => r.id !== id));
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalDevices = rows.reduce((acc, r) => acc + (r.qti || 0), 0) || 1;
    const bcTotalDone = rows.reduce((acc, r) => acc + (r.bcDone || 0), 0);
    const rdTotalDone = rows.reduce((acc, r) => acc + (r.rdDone || 0), 0);
    
    // Cyber is still based on row count as it's a status, excluding N/A
    const cyberRows = rows.filter(r => r.cyber !== 'N/A');
    const totalCyberRows = cyberRows.length || 1;
    const cyberDone = cyberRows.filter(r => r.cyber === 'Approved').length;

    return {
      bc: { percentage: (bcTotalDone / totalDevices) * 100, completed: bcTotalDone, total: totalDevices },
      rd: { percentage: (rdTotalDone / totalDevices) * 100, completed: rdTotalDone, total: totalDevices },
      cyber: { percentage: (cyberDone / totalCyberRows) * 100, completed: cyberDone, total: cyberRows.length }
    };
  }, [rows]);

  const [sortConfig, setSortConfig] = useState<{ field: keyof ConfigReportRow, direction: 'asc' | 'desc' } | null>(null);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const matchesSearch = row.system.toLowerCase().includes(search.toLowerCase()) || 
                           row.venue.toLowerCase().includes(search.toLowerCase()) ||
                           row.assignee.toLowerCase().includes(search.toLowerCase());
      
      const matchesColumnFilters = Object.entries(columnFilters).every(([field, value]) => {
        const filterValue = value as string;
        if (!filterValue) return true;
        const val = row[field as keyof ConfigReportRow];
        const rowValue = val !== undefined && val !== null ? String(val).toLowerCase() : '';
        return rowValue.includes(filterValue.toLowerCase());
      });

      return matchesSearch && matchesColumnFilters;
    });
  }, [rows, search, columnFilters]);

  const sortedRows = useMemo(() => {
    let result = [...filteredRows];
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }
    return result;
  }, [filteredRows, sortConfig]);

  const handleReorder = (newOrder: ConfigReportRow[]) => {
    const updated = [...rows];
    const indices = sortedRows.map(sr => rows.findIndex(r => r.id === sr.id));
    indices.forEach((originalIdx, i) => {
      if (originalIdx !== -1) {
        updated[originalIdx] = newOrder[i];
      }
    });
    onRowsChange(updated);
  };

  const updateColumnFilter = (field: keyof ConfigReportRow, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }));
  };

  const [openFilter, setOpenFilter] = useState<keyof ConfigReportRow | null>(null);

  const ColumnFilterSelect = ({ field, label, options, align = 'left', isSortable = false, hideOptions = false }: { field: keyof ConfigReportRow, label: string, options?: string[], align?: 'left' | 'center', isSortable?: boolean, hideOptions?: boolean }) => {
    const uniqueValues = useMemo(() => {
      if (hideOptions) return [];
      if (options) return options;
      const values = rows.map(r => String(r[field])).filter(Boolean);
      return Array.from(new Set(values)).sort();
    }, [rows, field, options, hideOptions]);

    const isActive = !!columnFilters[field] || sortConfig?.field === field;

    return (
      <div className={clsx("relative group/header flex items-center gap-1", align === 'center' ? 'justify-center' : 'justify-start')}>
        <span className={clsx("transition-colors", isActive ? "text-indigo-400" : "text-slate-500")}>
          {label}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setOpenFilter(openFilter === field ? null : field);
          }}
          className={clsx(
            "p-1 rounded-md transition-all hover:bg-slate-800/50",
            openFilter === field ? "text-indigo-400 bg-slate-800/80" : "text-slate-600 group-hover/header:text-slate-400",
            isActive && "text-indigo-400"
          )}
        >
          <ChevronDown size={10} className={clsx("transition-transform duration-200", openFilter === field && "rotate-180")} />
        </button>

        <AnimatePresence>
          {openFilter === field && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setOpenFilter(null)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={clsx(
                  "absolute top-full mt-2 z-40 min-w-[140px] bg-[#0f172a] border border-slate-800/60 rounded-xl shadow-2xl p-1 backdrop-blur-xl",
                  align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
                )}
              >
                <div 
                  className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/40 mb-1"
                >
                  {isSortable ? 'Sort/Filter' : 'Filter'} {label}
                </div>
                
                {isSortable && (
                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        setSortConfig({ field, direction: 'asc' });
                        setOpenFilter(null);
                      }}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-colors flex items-center gap-2",
                        sortConfig?.field === field && sortConfig.direction === 'asc' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-slate-800/50"
                      )}
                    >
                      <ArrowUp size={10} /> Sort Ascending
                    </button>
                    <button
                      onClick={() => {
                        setSortConfig({ field, direction: 'desc' });
                        setOpenFilter(null);
                      }}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-colors flex items-center gap-2",
                        sortConfig?.field === field && sortConfig.direction === 'desc' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-slate-800/50"
                      )}
                    >
                      <ArrowDown size={10} /> Sort Descending
                    </button>
                    {sortConfig?.field === field && (
                      <button
                        onClick={() => {
                          setSortConfig(null);
                          setOpenFilter(null);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Clear Sort
                      </button>
                    )}
                    {!hideOptions && <div className="h-px bg-slate-800/40 my-1" />}
                  </div>
                )}

                {!hideOptions && (
                  <>
                    <button
                      onClick={() => {
                        updateColumnFilter(field, '');
                        setOpenFilter(null);
                      }}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-colors",
                        !columnFilters[field] ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-slate-800/50"
                      )}
                    >
                      ALL
                    </button>
                    {uniqueValues.map(val => (
                      <button
                        key={val}
                        onClick={() => {
                          updateColumnFilter(field, val);
                          setOpenFilter(null);
                        }}
                        className={clsx(
                          "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-colors",
                          columnFilters[field] === val ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-slate-800/50"
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#020617] overflow-hidden relative">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* KPIs Section - Scrolls away */}
        <div className="p-12 pb-6 flex flex-col gap-10 bg-[#020617]">
          <div className="flex gap-8">
            <div className="flex-1">
              <CircularProgress 
                percentage={kpis.bc.percentage} 
                label="Base Configuration" 
                color="#06b6d4" 
                glowColor="#06b6d4" 
                total={kpis.bc.total}
                completed={kpis.bc.completed}
                icon={Settings}
              />
            </div>
            <div className="flex-1">
              <CircularProgress 
                percentage={kpis.rd.percentage} 
                label="Ready for Deployment" 
                color="#6366f1" 
                glowColor="#6366f1" 
                total={kpis.rd.total}
                completed={kpis.rd.completed}
                icon={Rocket}
              />
            </div>
            <div className="flex-1">
              <CircularProgress 
                percentage={kpis.cyber.percentage} 
                label="Cyber Approved" 
                color="#10b981" 
                glowColor="#10b981" 
                total={kpis.cyber.total}
                completed={kpis.cyber.completed}
                icon={ShieldCheck}
              />
            </div>
          </div>
        </div>

        {/* Sticky Controls Container */}
        <div className="sticky top-0 z-30 bg-[#020617] shadow-2xl border-b border-slate-800/40 h-[110px] flex items-center">
          {/* Table Controls */}
          <div className="flex items-center justify-between px-16 w-full">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <div className="text-[9px] font-black text-indigo-500/60 uppercase tracking-[0.3em] mb-0.5">Project Context</div>
                <div className="text-sm font-black text-slate-200 uppercase tracking-widest">{projectName}</div>
              </div>
              <div className="h-8 w-px bg-slate-800/40" />
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="SEARCH SYSTEMS..." 
                  className="bg-[#0f172a]/40 border border-slate-800/50 rounded-2xl pl-12 pr-6 py-3 text-xs font-bold text-slate-300 outline-none focus:border-indigo-500/40 transition-all w-80 placeholder:text-slate-700 uppercase tracking-widest"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {Object.keys(columnFilters).length > 0 || sortConfig ? (
                <button 
                  onClick={() => {
                    setColumnFilters({});
                    setSortConfig(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                >
                  Clear All Filters <X size={12} />
                </button>
              ) : null}
              {isAdmin && (
                <button 
                  onClick={addNewRow}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Plus size={16} strokeWidth={3} /> Add System
                </button>
              )}
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Showing {sortedRows.length} of {rows.length} Systems
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="px-12 pb-12 pt-6">
          <div className="bg-[#0f172a]/20 rounded-[2.5rem] border border-slate-800/40 backdrop-blur-xl shadow-2xl">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 pl-6 w-[60px] border-b border-slate-800/60"></th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="bc" label="BC" options={['green', 'orange', 'red', 'none']} align="center" />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="rd" label="RD" options={['green', 'orange', 'red', 'none']} align="center" />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="system" label="SystemName" />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="qti" label="QTI" align="center" isSortable hideOptions />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="venue" label="Venue" />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="device" label="Device Name" />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="bcDone" label="BC Complete" />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="rdDone" label="RD Complete" />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="aw" label="AW" options={['green', 'orange', 'red', 'none']} align="center" />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="cyber" label="Cyber" options={['Approved', 'Review', 'Blocked']} />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/60">
                    <ColumnFilterSelect field="assignee" label="Assignee" />
                  </th>
                  <th className="sticky top-[110px] z-20 bg-[#0f172a] p-4 pr-6 w-[60px] border-b border-slate-800/60"></th>
                </tr>
              </thead>
              <Reorder.Group axis="y" values={sortedRows} onReorder={handleReorder} as="tbody">
                <AnimatePresence>
                  {sortedRows.map((row) => (
                    <Reorder.Item 
                      key={row.id}
                      value={row}
                      as="tr"
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "group border-b border-slate-800/30 hover:bg-indigo-500/5 transition-all relative",
                        row.active && "bg-indigo-500/10 after:absolute after:inset-0 after:border-2 after:border-indigo-500/40 after:rounded-xl after:pointer-events-none"
                      )}
                    >
                      <td className="p-4 pl-6 w-[60px]">
                        <GripVertical size={14} className="text-slate-700 group-hover:text-slate-500 transition-colors cursor-grab active:cursor-grabbing" />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <StatusDot status={row.bc} onClick={() => cycleStatus(row.id, 'bc')} />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <StatusDot status={row.rd} onClick={() => cycleStatus(row.id, 'rd')} />
                        </div>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={row.system} 
                          readOnly={!isAdmin}
                          onChange={(e) => updateRow(row.id, 'system', e.target.value)}
                          className={cn(
                            "bg-transparent border-none outline-none text-xs font-bold text-slate-300 tracking-tight w-full transition-colors",
                            isAdmin ? "focus:text-indigo-400 cursor-text" : "cursor-default"
                          )}
                        />
                      </td>
                      <td className="p-4 text-center">
                        <input 
                          type="number" 
                          value={row.qti} 
                          readOnly={!isAdmin}
                          onChange={(e) => updateRow(row.id, 'qti', parseInt(e.target.value) || 0)}
                          className={cn(
                            "bg-transparent border-none outline-none text-xs font-black text-slate-400 tabular-nums w-12 text-center transition-colors",
                            isAdmin ? "focus:text-indigo-400 cursor-text" : "cursor-default"
                          )}
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={row.venue} 
                          readOnly={!isAdmin}
                          onChange={(e) => updateRow(row.id, 'venue', e.target.value)}
                          className={cn(
                            "bg-transparent border-none outline-none text-xs font-bold text-slate-400 tracking-tight w-full transition-colors",
                            isAdmin ? "focus:text-indigo-400 cursor-text" : "cursor-default"
                          )}
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={row.device} 
                          readOnly={!isAdmin}
                          onChange={(e) => updateRow(row.id, 'device', e.target.value)}
                          className={cn(
                            "bg-transparent border-none outline-none text-xs font-bold text-slate-400 tracking-tight w-full transition-colors",
                            isAdmin ? "focus:text-indigo-400 cursor-text" : "cursor-default"
                          )}
                        />
                      </td>
                      <td className="p-4">
                        <TableProgressBar 
                          done={row.bcDone} 
                          total={row.qti}
                          color="bg-cyan-500" 
                          onDoneChange={isAdmin ? (val) => updateRow(row.id, 'bcDone', val) : undefined}
                        />
                      </td>
                      <td className="p-4">
                        <TableProgressBar 
                          done={row.rdDone} 
                          total={row.qti}
                          color="bg-indigo-500" 
                          onDoneChange={isAdmin ? (val) => updateRow(row.id, 'rdDone', val) : undefined}
                        />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <StatusDot status={row.aw} onClick={() => cycleStatus(row.id, 'aw')} />
                        </div>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => cycleCyber(row.id)}
                          disabled={!isAdmin}
                          className={cn(
                            "w-full px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-center border transition-all",
                            isAdmin && "hover:scale-105 active:scale-95",
                            row.cyber === 'Approved' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                            row.cyber === 'Review' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            row.cyber === 'Blocked' && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                            row.cyber === 'N/A' && "bg-slate-500/10 text-slate-400 border-slate-500/20",
                          )}
                        >
                          {row.cyber}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            <User size={12} className="text-slate-500" />
                          </div>
                          {isAdmin ? (
                            <div className="relative flex-1 group/select">
                              <select
                                value={members.find(m => m.name === row.assignee)?.id || ''}
                                onChange={(e) => {
                                  const member = members.find(m => m.id === e.target.value);
                                  if (member) {
                                    onRowsChange(rows.map(r => r.id === row.id ? { 
                                      ...r, 
                                      assignee: member.name
                                    } : r));
                                  }
                                }}
                                className="bg-transparent border-none outline-none text-xs font-bold text-slate-300 tracking-tight w-full cursor-pointer focus:text-indigo-400 appearance-none pr-4"
                              >
                                <option value="" disabled className="bg-slate-900">Select Assignee</option>
                                {members.map(m => (
                                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-300 tracking-tight">
                              {row.assignee}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 pr-6 w-[60px]">
                        {isAdmin && (
                          <button 
                            onClick={() => deleteRow(row.id)}
                            className="p-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- App Component ---

// --- Kanban Components ---

const KanbanColumn: React.FC<{ 
  status: IssueStatus, 
  issues: Issue[], 
  project: ProjectData,
  setDraftIssue: (issue: Issue) => void
}> = ({ status, issues, project, setDraftIssue }) => {
  const { setNodeRef } = useSortable({
    id: status,
  });

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-[340px] flex flex-col glass-v2 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-indigo-500/5">
      {/* Column Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)] ${
            status === 'Open' ? 'bg-red-500' :
            status === 'Investigating' ? 'bg-blue-500' :
            status === 'Waiting for Parts' ? 'bg-amber-500' :
            'bg-emerald-500'
          }`} />
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-100">{status}</h3>
        </div>
        <span className="text-[10px] font-mono font-black text-slate-400 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 shadow-inner">{issues.length}</span>
      </div>

      {/* Column Content */}
      <SortableContext items={issues.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar bg-gradient-to-b from-transparent to-slate-950/20">
          {issues.map(issue => (
            <SortableIssueCard 
              key={issue.id} 
              issue={issue} 
              project={project} 
              onClick={() => setDraftIssue(issue)} 
            />
          ))}
          {issues.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 relative group/empty">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover/empty:bg-indigo-500/10 transition-colors duration-700" />
              </div>
              <div className="relative z-10 flex flex-col items-center opacity-10 group-hover/empty:opacity-20 transition-opacity duration-700">
                <ShieldAlert size={48} className="text-slate-500 mb-6 stroke-[1.5]" />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-400">Clear</span>
                  <div className="w-8 h-0.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-indigo-500/50 pulse-line" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const SortableIssueCard: React.FC<{ 
  issue: Issue, 
  project: ProjectData, 
  onClick: () => void 
}> = ({ issue, project, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      {...listeners}
      className="outline-none"
      onClick={onClick}
    >
      <StaticIssueCard issue={issue} project={project} isDragging={isDragging} />
    </div>
  );
};

const StaticIssueCard: React.FC<{ 
  issue: Issue, 
  project: ProjectData, 
  isDragging?: boolean,
  isOverlay?: boolean
}> = ({ issue, project, isDragging, isOverlay }) => {
  const system = project.systems.find(s => s.id === issue.systemId);
  const assignee = project.members.find(m => m.id === issue.assigneeId);

  const severityColors = {
    Critical: 'from-red-600 to-red-400 shadow-red-500/20',
    High: 'from-orange-600 to-orange-400 shadow-orange-500/20',
    Medium: 'from-amber-600 to-amber-400 shadow-amber-500/20',
    Low: 'from-blue-600 to-blue-400 shadow-blue-500/20'
  };

  const statusBaseColor = {
    'Open': 'bg-red-500',
    'Investigating': 'bg-blue-500',
    'Waiting for Parts': 'bg-amber-500',
    'Resolved': 'bg-emerald-500'
  };

  const statusGlowColor = {
    'Open': 'shadow-[0_0_15px_rgba(239,68,68,0.5)]',
    'Investigating': 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
    'Waiting for Parts': 'shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    'Resolved': 'shadow-[0_0_15px_rgba(16,185,129,0.5)]'
  };

  return (
    <div 
      className={cn(
        "bg-[#0a0f1d]/60 border border-white/5 rounded-2xl p-5 relative overflow-hidden tilt-card group/card backdrop-blur-sm",
        isDragging && !isOverlay && "opacity-0",
        !isDragging && "cursor-grab shadow-xl",
        isOverlay && "ring-1 ring-indigo-500/50 border-indigo-500/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-grabbing"
      )}
    >
      {/* Status Accent Line - Matches Column Color */}
      <div className={cn(
        "absolute top-0 left-0 bottom-0 w-1.5 transition-all duration-500 group-hover/card:w-2",
        statusBaseColor[issue.status],
        statusGlowColor[issue.status],
        issue.severity === 'Critical' && "breathe"
      )} />
      
      {/* Subtle Glow - Matches Column Color */}
      <div className={cn(
        "absolute top-0 left-0 bottom-0 w-8 blur-3xl opacity-5 transition-all duration-500 group-hover/card:opacity-15",
        statusBaseColor[issue.status]
      )} />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm transition-all duration-300",
              issue.severity === 'Critical' ? 'neon-text-red border neon-border-red bg-red-500/5' :
              issue.severity === 'High' ? 'bg-orange-500 text-white' :
              issue.severity === 'Medium' ? 'bg-amber-500 text-slate-950' :
              'bg-blue-500 text-white'
            )}>
              {issue.severity}
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold tracking-tighter opacity-60">#{issue.id.split('-')[1]?.slice(0, 4) || 'ISSUE'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter opacity-70">{assignee?.name.split(' ')[0] || 'UNASSIGNED'}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center text-[11px] font-black text-slate-300 shadow-inner group-hover/card:border-white/10 transition-colors">
            {assignee ? assignee.name.charAt(0) : '?'}
          </div>
        </div>
      </div>
      
      <h4 className="text-[14px] font-bold text-slate-100 mb-2 group-hover/card:text-white transition-colors leading-tight tracking-tight">
        {issue.title}
      </h4>

      <p className="text-[11px] text-slate-400 line-clamp-2 mb-5 leading-relaxed font-medium">
        {issue.description || 'No description provided for this anomaly.'}
      </p>
      
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800/50 group-hover/card:border-slate-700 transition-colors">
          <Box size={12} className="text-indigo-400" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate max-w-[120px]">{system?.name || 'System'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse",
            issue.severity === 'Critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500/40'
          )} />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Tracking</span>
        </div>
        <div className="flex items-center gap-3 opacity-40 group-hover/card:opacity-100 transition-opacity duration-500">
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="text-slate-500" />
            <span className="text-[9px] font-mono font-bold text-slate-500">{new Date(issue.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag size={10} className="text-slate-500" />
            <span className="text-[9px] font-mono font-bold text-slate-500">V{project.version}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemRegistryCard: React.FC<{
  sys: SystemInfo,
  project: ProjectData,
  isAdmin: boolean,
  setDraftSystem: (sys: SystemInfo) => void,
  setActiveCheckSheetSys: (sys: SystemInfo) => void,
  setActiveAppListSys: (sys: SystemInfo) => void,
  setActiveNamingConventionSys: (sys: SystemInfo) => void,
  setActiveLessonsLearnedSys: (sys: SystemInfo) => void
}> = ({ 
  sys, 
  project, 
  isAdmin, 
  setDraftSystem, 
  setActiveCheckSheetSys, 
  setActiveAppListSys, 
  setActiveNamingConventionSys, 
  setActiveLessonsLearnedSys 
}) => {
  const assignee = project.members.find(m => m.id === sys.assigneeId);
  const hasIssues = project.issues.some(i => i.systemId === sys.id && i.status !== 'Resolved');

  const stats = useMemo(() => {
    const data = sys.checkSheetData || DEFAULT_CHECKSHEET;
    const config = data.configuration || [];
    const ready = data.readyForDeployment || [];
    const deploy = data.deployment || [];
    
    return {
      config: { done: config.filter(i => i.completed).length, total: config.length },
      ready: { done: ready.filter(i => i.completed).length, total: ready.length },
      deploy: { done: deploy.filter(i => i.completed).length, total: deploy.length }
    };
  }, [sys.checkSheetData]);

  const totalDone = stats.config.done + stats.ready.done + stats.deploy.done;
  const totalItems = stats.config.total + stats.ready.total + stats.deploy.total;
  const progressPercent = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  return (
    <div className="group relative bg-[#0a0f1d]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-indigo-500/30 hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6),0_0_40px_rgba(99,102,241,0.1)] flex flex-col h-full">
      {/* Dynamic Status Glow */}
      <div className={cn(
        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 transition-all duration-700 group-hover:opacity-40",
        hasIssues ? "bg-red-500" : "bg-indigo-500"
      )} />
      
      {/* Assignee Badge - Floating Pill */}
      <div className="absolute top-4 right-6 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md z-10 shadow-sm">
        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase whitespace-nowrap group-hover:text-indigo-300 transition-colors">
          {assignee ? assignee.name.split(' ')[0] : 'UNASSIGNED'}
        </span>
      </div>

      <div className="p-6 pt-10 flex flex-col h-full relative z-10">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6 cursor-pointer" onClick={() => setDraftSystem(sys)}>
          <div className="relative">
            <div className="w-14 h-14 bg-slate-900/50 border border-white/10 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner group-hover:border-indigo-500/40 transition-all duration-500 group-hover:scale-105">
              {getDeviceIcon(sys.deviceCategory, 28)}
            </div>
            {hasIssues && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-[#0a0f1d] animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-black tracking-tight uppercase leading-tight text-white group-hover:text-indigo-300 transition-colors truncate mb-0.5",
              sys.name.length > 20 ? "text-sm" : "text-base"
            )}>
              {sys.name}
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] opacity-70">
              {sys.deviceCategory} <span className="mx-1 opacity-30">•</span> {sys.deviceType || 'Unit'}
            </p>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 group/spec hover:bg-slate-800/40 transition-all">
            <div className="flex items-center gap-2">
              {getOSIcon(sys.os, 14)}
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Platform</p>
            </div>
            <p className="text-[11px] font-bold text-slate-200 truncate">{sys.os} <span className="text-slate-500 text-[9px] ml-1">v.{sys.osVersion || 'X'}</span></p>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 group/spec hover:bg-slate-800/40 transition-all">
            <div className="flex items-center gap-2">
              {getNetworkIcon(sys.network || 'Wired', 14)}
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">VLAN</p>
            </div>
            <p className="text-[11px] font-bold text-slate-200 truncate uppercase">
              {sys.network || 'Wired'} <span className="text-indigo-400/60 text-[9px] ml-1">#{sys.vlan || '000'}</span>
            </p>
          </div>

          {/* IP Block - Prominent */}
          <div className="col-span-2 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 group/spec hover:bg-indigo-500/10 transition-all duration-300">
            <div className="grid grid-cols-2 gap-4 divide-x divide-indigo-500/10">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Globe size={10} className="text-indigo-400/40" />
                  <p className="text-[7px] font-black text-indigo-400/60 uppercase tracking-[0.2em]">IP Scope</p>
                </div>
                <p className="text-[10px] font-mono font-bold text-indigo-300 tracking-tight leading-tight">
                  {sys.ipScope || '0.0.0.0'}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 pl-4">
                <div className="flex items-center gap-2">
                  <Tag size={10} className="text-indigo-400/40" />
                  <p className="text-[7px] font-black text-indigo-400/60 uppercase tracking-[0.2em]">Reservation</p>
                </div>
                <p className="text-[10px] font-mono font-bold text-indigo-300 tracking-tight leading-tight">
                  {sys.ipReservation || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details - Clean Typography */}
        <div className="space-y-3 mb-8 px-1">
          {[
            { icon: <ShieldCheck size={12} />, label: 'Service Account', value: sys.serviceAccount || 'N/A' },
            { icon: <User size={12} />, label: 'User Context', value: sys.userAccount || '---' },
            { icon: getLogonIcon(sys.logonType || '', 12), label: 'Auth Type', value: sys.logonType || '---' },
            { icon: <Layers size={12} />, label: 'Domain OU', value: sys.domainOU || '---' },
            { icon: <Hash size={12} />, label: 'AirWatch Tags', value: sys.airWatchTags || '---' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between group/item">
              <div className="flex items-center gap-3 text-slate-500 group-hover/item:text-slate-400 transition-colors">
                <div className="opacity-40">{item.icon}</div>
                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-300 tracking-tight truncate ml-4">
                {item.value}
              </span>
            </div>
          ))}
          {sys.documentation && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-start gap-3">
                <FileText size={12} className="text-indigo-400/40 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 italic opacity-80">
                  {sys.documentation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions - 2x2 Grid Revolution */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <SystemActionButton 
            label="Check" 
            icon={sys.checkSheetData ? <ClipboardCheck size={16} /> : <ClipboardList size={16} />}
            active={!!(sys.checkSheet || sys.checkSheetData)}
            color="emerald"
            onClick={() => setActiveCheckSheetSys(sys)}
          />
          <SystemActionButton 
            label="Apps" 
            icon={<AppWindow size={16} />}
            active={!!sys.appList}
            color="blue"
            onClick={() => setActiveAppListSys(sys)}
          />
          <SystemActionButton 
            label="Naming" 
            icon={<Tag size={16} />}
            active={!!sys.namingConvention}
            color="violet"
            onClick={() => setActiveNamingConventionSys(sys)}
          />
          <SystemActionButton 
            label="Lessons" 
            icon={<FileText size={16} />}
            active={!!sys.lessonsLearned}
            color="amber"
            onClick={() => setActiveLessonsLearnedSys(sys)}
          />
        </div>
        
        {/* Minimalist Stats Footer */}
        <div 
          onClick={() => isAdmin && setDraftSystem(sys)}
          className={cn(
            "mt-6 w-full py-4 px-6 border-t border-white/5 group-hover:border-indigo-500/20 transition-all duration-300 flex items-center justify-between",
            isAdmin && "cursor-pointer hover:bg-white/[0.02]"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 group/stat">
              <Settings size={10} className="text-emerald-500/60 group-hover/stat:text-emerald-400 transition-colors" />
              <span className="text-[9px] font-black text-slate-500 group-hover/stat:text-slate-300 transition-colors tracking-tighter">
                {stats.config.done}/{stats.config.total}
              </span>
            </div>
            <div className="flex items-center gap-1.5 group/stat">
              <ClipboardCheck size={10} className="text-blue-500/60 group-hover/stat:text-blue-400 transition-colors" />
              <span className="text-[9px] font-black text-slate-500 group-hover/stat:text-slate-300 transition-colors tracking-tighter">
                {stats.ready.done}/{stats.ready.total}
              </span>
            </div>
            <div className="flex items-center gap-1.5 group/stat">
              <Zap size={10} className="text-amber-500/60 group-hover/stat:text-amber-400 transition-colors" />
              <span className="text-[9px] font-black text-slate-500 group-hover/stat:text-slate-300 transition-colors tracking-tighter">
                {stats.deploy.done}/{stats.deploy.total}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <span className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemActionButton: React.FC<{
  label: string,
  icon: React.ReactNode,
  active: boolean,
  color: 'emerald' | 'blue' | 'violet' | 'amber',
  onClick: () => void
}> = ({ label, icon, active, color, onClick }) => {
  const colorClasses = {
    emerald: active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-900/40 border-white/5 text-slate-500',
    blue: active ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-900/40 border-white/5 text-slate-500',
    violet: active ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-slate-900/40 border-white/5 text-slate-500',
    amber: active ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-900/40 border-white/5 text-slate-500',
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-3 rounded-2xl border transition-all duration-300 group/btn hover:scale-[1.05] active:scale-[0.95] hover:shadow-lg",
        colorClasses[color]
      )}
    >
      <div className="shrink-0 transition-transform duration-300 group-hover/btn:scale-110">
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest leading-none">{label}</span>
    </button>
  );
};

const getTaskStatusConfig = (status: TaskStatus, isLead?: boolean) => {
  if (isLead === undefined) { // Milestone
    switch(status) {
      case 'Completed': return { accent: 'bg-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: '' };
      case 'In Progress': return { accent: 'bg-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-400', glow: '' };
      case 'Blocked': return { accent: 'bg-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-400', glow: '' };
      default: return { accent: 'bg-slate-500', bg: 'bg-slate-700/5', border: 'border-slate-600/20', text: 'text-slate-400', glow: '' };
    }
  }
  if (isLead) {
    switch(status) {
      case 'Completed': return { accent: 'bg-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20', text: 'text-amber-200', glow: '' };
      case 'In Progress': return { accent: 'bg-amber-500', bg: 'bg-amber-600/5', border: 'border-amber-500/10', text: 'text-amber-100', glow: '' };
      case 'Blocked': return { accent: 'bg-orange-600', bg: 'bg-orange-900/10', border: 'border-orange-500/30', text: 'text-orange-100', glow: '' };
      default: return { accent: 'bg-amber-700', bg: 'bg-amber-900/5', border: 'border-amber-800/20', text: 'text-amber-400/70', glow: '' };
    }
  } else {
    switch(status) {
      case 'Completed': return { accent: 'bg-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-300', glow: '' };
      case 'In Progress': return { accent: 'bg-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-300', glow: '' };
      case 'Blocked': return { accent: 'bg-rose-400', bg: 'bg-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-300', glow: '' };
      default: return { accent: 'bg-slate-500', bg: 'bg-slate-700/5', border: 'border-slate-600/20', text: 'text-slate-300', glow: '' };
    }
  }
};

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '741593') {
      onLogin();
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-[9999]">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 relative"
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl" />
        
        <div className="relative flex flex-col items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <Lock className="text-white w-10 h-10" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Secure Access</h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide uppercase opacity-60">Enter password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-5 text-xl text-center text-white outline-none transition-all placeholder:text-slate-700",
                  "focus:border-indigo-500/30 focus:bg-slate-950/80",
                  error && "border-red-500/50 bg-red-500/5 shake"
                )}
                autoFocus
              />
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-6 left-0 w-full text-center text-red-400 text-[10px] font-bold uppercase tracking-widest"
                >
                  Invalid Password
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-50 transition-all active:scale-[0.98] group"
            >
              <span className="uppercase tracking-widest text-sm">Unlock System</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="pt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">System Operational</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


// --- Project Panel Components ---

const ProjectPanel: React.FC<{
  member: NDBTMember;
  projects: UserProject[];
  onClose: () => void;
  isAdmin: boolean;
  onProjectsChange: (memberId: string, updatedProjects: UserProject[]) => void;
}> = ({ member, projects, onClose, isAdmin, onProjectsChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPM, setEditPM] = useState('');
  const [editEngineers, setEditEngineers] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPM, setNewPM] = useState('');
  const [newEngineers, setNewEngineers] = useState('');

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [projects, searchQuery]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newProject: UserProject = {
      id: `up-${Date.now()}`,
      name: newName.trim(),
      projectManager: newPM.trim() || undefined,
      engineers: newEngineers.trim() || undefined
    };
    onProjectsChange(member.id, [...projects, newProject]);
    setNewName('');
    setNewPM('');
    setNewEngineers('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    onProjectsChange(member.id, projects.filter(p => p.id !== id));
  };

  const handleEditStart = (project: UserProject) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditPM(project.projectManager || '');
    setEditEngineers(project.engineers || '');
  };

  const handleEditSave = () => {
    if (!editName.trim()) return;
    onProjectsChange(member.id, projects.map(p => p.id === editingId ? { 
      ...p, 
      name: editName.trim(),
      projectManager: editPM.trim() || undefined,
      engineers: editEngineers.trim() || undefined
    } : p));
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-[420px] bg-[#0a0f1d]/95 backdrop-blur-2xl border border-indigo-500/30 rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="absolute inset-0 rounded-[32px] border border-indigo-500/20 pointer-events-none shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]" />
        
        <div className="p-8 border-b border-white/5 bg-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-white uppercase">{member.name}</h3>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{projects.length} Total Projects</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-full transition-all"
                >
                  <Plus size={20} />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[450px] overflow-y-auto custom-scrollbar flex flex-col gap-3">
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-[24px] border border-indigo-500/30 bg-indigo-500/5 flex flex-col gap-3"
            >
              <input
                autoFocus
                type="text"
                placeholder="Project name..."
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-sm text-white outline-none focus:border-indigo-500/50"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Project Manager..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-[10px] text-blue-400 outline-none focus:border-blue-500/50"
                  value={newPM}
                  onChange={e => setNewPM(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Engineers..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-[10px] text-amber-400 outline-none focus:border-amber-500/50"
                  value={newEngineers}
                  onChange={e => setNewEngineers(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Cancel</button>
                <button onClick={handleAdd} className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Add Project</button>
              </div>
            </motion.div>
          )}

          {filteredProjects.map(project => (
            <motion.div
              key={project.id}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
              className="p-5 rounded-[24px] border border-white/5 bg-white/[0.02] transition-all group"
            >
              {editingId === project.id ? (
                <div className="flex flex-col gap-3">
                  <input
                    autoFocus
                    type="text"
                    className="w-full bg-black/40 border border-indigo-500/50 rounded-xl py-2 px-4 text-sm text-white outline-none"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Project Manager..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-[10px] text-blue-400 outline-none focus:border-blue-500/50"
                      value={editPM}
                      onChange={e => setEditPM(e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Engineers..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-[10px] text-amber-400 outline-none focus:border-amber-500/50"
                      value={editEngineers}
                      onChange={e => setEditEngineers(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Cancel</button>
                    <button onClick={handleEditSave} className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">{project.name}</h4>
                    {isAdmin && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditStart(project)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(project.id)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {project.projectManager && (
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                        <span className="text-[10px] font-light text-blue-400/90 tracking-wide">PM: {project.projectManager}</span>
                      </div>
                    )}
                    {project.engineers && (
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-amber-500/40" />
                        <span className="text-[10px] font-light text-amber-400/90 tracking-wide">ENG: {project.engineers}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    {!isAdmin && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        <Layers size={16} className="text-indigo-500" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
          {filteredProjects.length === 0 && !isAdding && (
            <div className="py-16 flex flex-col items-center justify-center opacity-20">
              <Layers size={48} className="mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">No projects found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const App = () => {
  // Secure Access startup screen disabled: users open the application directly.
  const [isAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'systems' | 'sync' | 'issues' | 'config-report'>(() => {
    const hash = window.location.hash.replace('#', '');
    if (['roadmap', 'systems', 'sync', 'issues', 'config-report'].includes(hash)) return hash as any;
    return 'roadmap';
  });

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [memberRect, setMemberRect] = useState<{ x: number; y: number } | null>(null);

  const [projects, setProjects] = useState<ProjectMeta[]>(() => {
    const saved = localStorage.getItem('nbdt_projects_list');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'legend-ots', name: 'Legend OTS' },
      { id: 'hero-ots', name: 'Hero OTS' }
    ];
  });

  const [project, setProject] = useState<ProjectData>(() => {
    const lastProjectId = localStorage.getItem('nbdt_last_project_id') || 'legend-ots';
    const saved = localStorage.getItem(`nbdt_project_${lastProjectId}`);
    
    const base = {
      id: lastProjectId,
      name: lastProjectId === 'legend-ots' ? 'Legend OTS' : (lastProjectId === 'hero-ots' ? 'Hero OTS' : 'New Project'),
      tasks: [
        // HOMESH
        { id: 'h1', label: 'OHC - GPS (Embarkation & CIW)', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
        { id: 'h2', label: 'OHC - Print Shop', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
        { id: 'h3', label: 'OHC - On the Go', category: 'GENERAL', startWeek: 2, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
        { id: 'h4', label: 'OHC - Concierges', category: 'GENERAL', startWeek: 3, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
        { id: 'h5', label: 'OHC - Guest Services (Front Desk / Back Office)', category: 'GENERAL', startWeek: 4, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
        { id: 'h6', label: 'OHC - Shipboard Financial Operations', category: 'GENERAL', startWeek: 5, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
        { id: 'h7', label: 'Pre-Paid Gratuities', category: 'GENERAL', startWeek: 6, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
        { id: 'h8', label: 'CashPro', category: 'GENERAL', startWeek: 7, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
        { id: 'h9', label: 'OHC - APIS', category: 'GENERAL', startWeek: 8, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
        { id: 'h10', label: 'OHC - SPMS', category: 'GENERAL', startWeek: 9, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
        { id: 'h11', label: 'Next Cruise', category: 'GENERAL', startWeek: 10, duration: 4, status: 'Planned', description: '', memberId: 'm1' },

        // JORGE
        { id: 'j1', label: 'Frictionless Embarkation', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j2', label: 'OHC - Security (ACP)', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j3', label: 'OHC - MGSO', category: 'GENERAL', startWeek: 2, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j4', label: 'Royal Genies', category: 'GENERAL', startWeek: 3, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j5', label: 'OHC - Guest Services (Front Desk / Back Office)', category: 'GENERAL', startWeek: 4, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j6', label: 'OHC - Safety', category: 'GENERAL', startWeek: 5, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j7', label: 'OHC - Crew / Crew Office', category: 'GENERAL', startWeek: 6, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j8', label: 'Mobile Gangway', category: 'GENERAL', startWeek: 7, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j9', label: 'OHC - Fleet Management System', category: 'GENERAL', startWeek: 8, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j10', label: 'OHC - SPMS', category: 'GENERAL', startWeek: 9, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j11', label: 'Royal Wowbands', category: 'GENERAL', startWeek: 10, duration: 4, status: 'Completed', description: '', memberId: 'm2' },
        { id: 'j12', label: 'ShowTickets', category: 'GENERAL', startWeek: 11, duration: 4, status: 'Completed', description: '', memberId: 'm2' },

        // APPLE / NILSON
        { id: 'a1', label: 'AffairWhere', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Planned', description: '', memberId: 'm3' },
        { id: 'a2', label: 'CrunchTime', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Planned', description: '', memberId: 'm3' },
        { id: 'a3', label: 'GHS', category: 'GENERAL', startWeek: 2, duration: 4, status: 'Planned', description: '', memberId: 'm3' },
        { id: 'a4', label: 'POS', category: 'GENERAL', startWeek: 3, duration: 4, status: 'Planned', description: '', memberId: 'm3' },
        { id: 'a5', label: 'POS - Mobility', category: 'GENERAL', startWeek: 4, duration: 4, status: 'Completed', description: '', memberId: 'm3' },
        { id: 'a6', label: 'Virtual Queue', category: 'GENERAL', startWeek: 5, duration: 4, status: 'Planned', description: '', memberId: 'm3' },
        { id: 'a7', label: 'XDining', category: 'GENERAL', startWeek: 6, duration: 4, status: 'Completed', description: '', memberId: 'm3' },
        { id: 'a8', label: 'Food Production Management System', category: 'GENERAL', startWeek: 7, duration: 4, status: 'Completed', description: '', memberId: 'm3' },

        // ELVAN
        { id: 'e1', label: 'Housekeeping Tablets', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Completed', description: '', memberId: 'm4' },
        { id: 'e2', label: 'Housekeeping Robots', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Completed', description: '', memberId: 'm4' },
        { id: 'e3', label: 'Housekeeping Inventory Management', category: 'GENERAL', startWeek: 2, duration: 4, status: 'Completed', description: '', memberId: 'm4' },
        { id: 'e4', label: 'SeaTime (Time & Attendance)', category: 'GENERAL', startWeek: 3, duration: 4, status: 'Completed', description: '', memberId: 'm4' },
        { id: 'e5', label: 'Stateroom Attendant App', category: 'GENERAL', startWeek: 4, duration: 4, status: 'Completed', description: '', memberId: 'm4' },
        { id: 'e6', label: 'Room Service', category: 'GENERAL', startWeek: 5, duration: 4, status: 'Completed', description: '', memberId: 'm4' },
        { id: 'e7', label: 'Safetyculture', category: 'GENERAL', startWeek: 6, duration: 4, status: 'Completed', description: '', memberId: 'm4' },
        { id: 'e8', label: 'Shore Excursions', category: 'GENERAL', startWeek: 7, duration: 4, status: 'Completed', description: '', memberId: 'm4' },
        { id: 'e9', label: 'Spa (OneApp)', category: 'GENERAL', startWeek: 8, duration: 4, status: 'Completed', description: '', memberId: 'm4' },

        // RONNY
        { id: 'r1', label: 'Digital Signage', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Completed', description: '', memberId: 'm5' },
        { id: 'r2', label: 'Crew Debit', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Completed', description: '', memberId: 'm5' },
        { id: 'r3', label: 'Butterfly', category: 'GENERAL', startWeek: 2, duration: 4, status: 'Completed', description: '', memberId: 'm5' },
        { id: 'r4', label: 'Room Automation', category: 'GENERAL', startWeek: 3, duration: 4, status: 'Completed', description: '', memberId: 'm5' },

        // NISHANT
        { id: 'n1', label: 'Nex Gen Playground', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n2', label: 'Digital Gaming Tables', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n3', label: 'Jukebox', category: 'GENERAL', startWeek: 2, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n4', label: 'Storybook', category: 'GENERAL', startWeek: 3, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n5', label: 'Check-in / Check-out App', category: 'GENERAL', startWeek: 4, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n6', label: 'Youth & Family - Registration App', category: 'GENERAL', startWeek: 5, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n7', label: 'IssuTrax', category: 'GENERAL', startWeek: 6, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n8', label: 'Shipboard Asset Tracking', category: 'GENERAL', startWeek: 7, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n9', label: 'iCafe', category: 'GENERAL', startWeek: 8, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n10', label: 'Smart Service (Guest Log)', category: 'GENERAL', startWeek: 9, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n11', label: 'Behind the Pearl', category: 'GENERAL', startWeek: 10, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n12', label: 'Photo', category: 'GENERAL', startWeek: 11, duration: 4, status: 'Completed', description: '', memberId: 'm6' },
        { id: 'n13', label: 'Photo - Video Capture', category: 'GENERAL', startWeek: 12, duration: 4, status: 'Completed', description: '', memberId: 'm6' },

        // NADEEM
        { id: 'nd1', label: 'MyTV - Lead', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Completed', description: '', memberId: 'm7' },
        { id: 'nd2', label: 'MyTV - Virtual Balcony', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Completed', description: '', memberId: 'm7' },
        { id: 'nd3', label: 'NEW MyTV - Streaming', category: 'GENERAL', startWeek: 2, duration: 4, status: 'Completed', description: '', memberId: 'm7' },

        // ROB
        { id: 'rb1', label: 'Casino - Bravo (Tables)', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Completed', description: '', memberId: 'm8' },
        { id: 'rb2', label: 'Casino - Currency Counter', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Completed', description: '', memberId: 'm8' },
        { id: 'rb3', label: 'Casino - Everi CashClub', category: 'GENERAL', startWeek: 2, duration: 4, status: 'Completed', description: '', memberId: 'm8' },
        { id: 'rb4', label: 'Casino - Everi TITO Kiosk', category: 'GENERAL', startWeek: 3, duration: 4, status: 'Completed', description: '', memberId: 'm8' },
        { id: 'rb5', label: 'Casino - Key Watcher', category: 'GENERAL', startWeek: 4, duration: 4, status: 'Completed', description: '', memberId: 'm8' },
        { id: 'rb6', label: 'Casino - Oasis 360 (Slots)', category: 'GENERAL', startWeek: 5, duration: 4, status: 'Completed', description: '', memberId: 'm8' },
        { id: 'rb7', label: 'Casino - Sovos Tax System', category: 'GENERAL', startWeek: 6, duration: 4, status: 'Completed', description: '', memberId: 'm8' },
        { id: 'rb8', label: 'Arcade', category: 'GENERAL', startWeek: 7, duration: 4, status: 'Completed', description: '', memberId: 'm8' },
        { id: 'rb9', label: 'Bingo', category: 'GENERAL', startWeek: 8, duration: 4, status: 'Completed', description: '', memberId: 'm8' },
        { id: 'rb10', label: 'eMustering', category: 'GENERAL', startWeek: 9, duration: 4, status: 'Completed', description: '', memberId: 'm8' },
        { id: 'rb11', label: 'SeaPay', category: 'GENERAL', startWeek: 10, duration: 4, status: 'Completed', description: '', memberId: 'm8' },

        // DODY
        { id: 'd1', label: 'MyTV - Support', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Planned', description: '', memberId: 'm9' },
        { id: 'd2', label: 'SimpleK', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Planned', description: '', memberId: 'm9' },
        { id: 'd3', label: 'Bank of America Tablets', category: 'GENERAL', startWeek: 2, duration: 4, status: 'Planned', description: '', memberId: 'm9' },

        // DARON
        { id: 'dr1', label: 'Lifeguard', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr2', label: 'Riskkonnect', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr3', label: 'eWaiver', category: 'GENERAL', startWeek: 2, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr4', label: 'OnVoy', category: 'GENERAL', startWeek: 3, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr5', label: 'AMOS', category: 'GENERAL', startWeek: 4, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr6', label: 'Mobile TeleHealth', category: 'GENERAL', startWeek: 5, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr7', label: 'Visionline (Door Locks)', category: 'GENERAL', startWeek: 6, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr8', label: 'Digital Manager', category: 'GENERAL', startWeek: 7, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr9', label: 'Safe Return to Port', category: 'GENERAL', startWeek: 8, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr10', label: 'SeaCare', category: 'GENERAL', startWeek: 9, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr11', label: 'SeaEvent', category: 'GENERAL', startWeek: 10, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr12', label: 'QControl', category: 'GENERAL', startWeek: 11, duration: 4, status: 'Completed', description: '', memberId: 'm10' },
        { id: 'dr13', label: 'Up to Date', category: 'GENERAL', startWeek: 12, duration: 4, status: 'Completed', description: '', memberId: 'm10' },

        // CLAUDIO
        { id: 'c1', label: 'MyTV - Support', category: 'GENERAL', startWeek: 0, duration: 4, status: 'Completed', description: '', memberId: 'm11' },
        { id: 'c2', label: 'TimePlay', category: 'GENERAL', startWeek: 1, duration: 4, status: 'Completed', description: '', memberId: 'm11' },
      ],
      assignmentTasks: [],
      members: INITIAL_MEMBERS,
      assignmentMembers: INITIAL_MEMBERS,
      systems: INITIAL_SYSTEMS,
      issues: INITIAL_ISSUES,
      configReportRows: INITIAL_CONFIG_REPORT_ROWS,
      startDate: '2026-01-05',
      updatedAt: 0
    };

    if (saved) {
      const parsed = JSON.parse(saved);
      return ensureProjectData(parsed);
    }
    
    // Migration: if Legend OTS was previously saved under the old key
    if (lastProjectId === 'legend-ots') {
      const oldSaved = localStorage.getItem('cp_v3_state');
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        return ensureProjectData({ ...parsed, id: 'legend-ots', name: 'Legend OTS' });
      }
    }

    return base;
  });

  const [userProjects, setUserProjects] = useState<Record<string, UserProject[]>>(() => {
    const saved = localStorage.getItem('nbdt_user_projects');
    if (saved) return JSON.parse(saved);
    return MOCK_USER_PROJECTS;
  });

  useEffect(() => {
    localStorage.setItem('nbdt_user_projects', JSON.stringify(userProjects));
  }, [userProjects]);

  const [lastUserProjectsSync, setLastUserProjectsSync] = useState(0);

  const handleUserProjectsChange = (memberId: string, updatedProjects: UserProject[]) => {
    const timestamp = Date.now();
    setUserProjects(prev => ({
      ...prev,
      [memberId]: updatedProjects
    }));
    setLastUserProjectsSync(timestamp);
  };

  useEffect(() => {
    if (lastUserProjectsSync > 0) {
      userProjectsUpdatedAtRef.current = lastUserProjectsSync;
      set(ref(db, 'nbdt/user_projects'), {
        data: userProjects,
        updatedAt: lastUserProjectsSync
      });
    }
  }, [lastUserProjectsSync, userProjects]);

  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectInput, setNewProjectInput] = useState('');
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null);

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'updated' | 'error'>('idle');
  const [syncConnected, setSyncConnected] = useState(false);
  const [draftTask, setDraftTask] = useState<RoadmapTask | null>(null);
  const [draftSystem, setDraftSystem] = useState<SystemInfo | null>(null);
  const [draftIssue, setDraftIssue] = useState<Issue | null>(null);
  const [activeCheckSheetSys, setActiveCheckSheetSys] = useState<SystemInfo | null>(null);
  const [activeAppListSys, setActiveAppListSys] = useState<SystemInfo | null>(null);
  const [activeNamingConventionSys, setActiveNamingConventionSys] = useState<SystemInfo | null>(null);
  const [activeLessonsLearnedSys, setActiveLessonsLearnedSys] = useState<SystemInfo | null>(null);
  const [systemSearch, setSystemSearch] = useState('');
  const [issueSearch, setIssueSearch] = useState('');
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [issueStatusFilter, setIssueStatusFilter] = useState<string>('');
  const [issueSeverityFilter, setIssueSeverityFilter] = useState<string>('');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ memberId: string, week: number } | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [hoveredTaskInfo, setHoveredTaskInfo] = useState<{ task: RoadmapTask, memberName: string, config: any, isMilestone: boolean, rect: DOMRect } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');

  useEffect(() => {
    (window as any).setIsAdmin = setIsAdmin;
    (window as any).setShowAdminAuthModal = setShowAdminAuthModal;
    (window as any).setAdminPassInput = setAdminPassInput;
  }, []);

  const ADMIN_PASSWORD = '741593';

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const updatedAtRef = useRef(project.updatedAt);
  const userProjectsUpdatedAtRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { daysFromStart, todayWeekIndex } = useMemo(() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = parseLocalDate(project.startDate || '2026-01-05');
      if (isNaN(start.getTime())) throw new Error('Invalid start date');
      start.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - start.getTime();
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return {
        daysFromStart: days,
        todayWeekIndex: Math.floor(days / 7)
      };
    } catch (e) {
      return { daysFromStart: 0, todayWeekIndex: 0 };
    }
  }, [project.startDate]);

  const [currentStartWeek, setCurrentStartWeek] = useState(todayWeekIndex + 1);

  useEffect(() => {
    if (!isNaN(todayWeekIndex) && activeTab === 'roadmap') {
        setTimeout(() => {
            scrollToWeek(todayWeekIndex + 1);
        }, 100);
    }
  }, [activeTab, todayWeekIndex]);

  const scrollToWeek = (week: number) => {
    if (!scrollContainerRef.current) return;
    const clampedWeek = Math.max(1, Math.min(week, TOTAL_WEEKS));
    const targetScroll = (clampedWeek - 1) * WEEK_WIDTH;
    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    setCurrentStartWeek(clampedWeek);
  };

  const handleNextWeek = () => scrollToWeek(currentStartWeek + 1);
  const handlePrevWeek = () => scrollToWeek(currentStartWeek - 1);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollPos = scrollContainerRef.current.scrollLeft;
    const weekIndex = Math.round(scrollPos / WEEK_WIDTH) + 1;
    if (weekIndex !== currentStartWeek) {
      setCurrentStartWeek(weekIndex);
    }
  };

  useEffect(() => {
    localStorage.setItem('nbdt_projects_list', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('nbdt_last_project_id', project.id);
    localStorage.setItem(`nbdt_project_${project.id}`, JSON.stringify(project));
  }, [project]);

  // Firebase Sync
  useEffect(() => {
    let isComponentMounted = true;

    // Listen for projects list
    const projectsListRef = ref(db, 'nbdt/projects_list');
    const unsubscribeList = onValue(projectsListRef, (snapshot) => {
      if (!isComponentMounted) return;
      const data = snapshot.val();
      if (data) {
        setProjects(data);
      }
    });

    // Listen for current project data
    const projectDataRef = ref(db, `nbdt/projects_data/${project.id}`);
    const unsubscribeData = onValue(projectDataRef, (snapshot) => {
      if (!isComponentMounted) return;
      const remoteData = snapshot.val();
      if (remoteData) {
        if (remoteData.updatedAt > updatedAtRef.current) {
          setProject(ensureProjectData(remoteData));
          updatedAtRef.current = remoteData.updatedAt;
          setSyncStatus('updated');
          setTimeout(() => {
            if (isComponentMounted) setSyncStatus('idle');
          }, 2000);
        }
      }
    });

    // Listen for user projects
    const userProjectsRef = ref(db, 'nbdt/user_projects');
    const unsubscribeUserProjects = onValue(userProjectsRef, (snapshot) => {
      if (!isComponentMounted) return;
      const remoteData = snapshot.val();
      if (remoteData) {
        if (remoteData.updatedAt > userProjectsUpdatedAtRef.current) {
          setUserProjects(remoteData.data);
          userProjectsUpdatedAtRef.current = remoteData.updatedAt;
        }
      }
    });

    // Listen for connection state
    const connectedRef = ref(db, ".info/connected");
    const unsubscribeConnected = onValue(connectedRef, (snap) => {
      if (!isComponentMounted) return;
      setSyncConnected(snap.val() === true);
    });

    setSyncStatus('idle');

    return () => {
      isComponentMounted = false;
      unsubscribeList();
      unsubscribeData();
      unsubscribeConnected();
      unsubscribeUserProjects();
    };
  }, [project.id]);

  const broadcastState = (nextState: ProjectData) => {
    setSyncStatus('syncing');
    const stateWithTimestamp = { ...nextState, updatedAt: Date.now() };
    updatedAtRef.current = stateWithTimestamp.updatedAt;
    
    set(ref(db, `nbdt/projects_data/${nextState.id}`), stateWithTimestamp)
      .then(() => {
        setSyncStatus('idle');
      })
      .catch((err) => {
        console.error("Firebase Sync Error:", err);
        setSyncStatus('error');
      });
  };

  const switchProject = async (id: string) => {
    try {
      setIsProjectMenuOpen(false);
      if (id === project.id) return;

      // Load from local storage first
      const saved = localStorage.getItem(`nbdt_project_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const ensured = ensureProjectData(parsed);
        setProject(ensured);
        updatedAtRef.current = ensured.updatedAt || 0;
      } else {
        // If not in local storage, set a skeleton
        const meta = projects.find(p => p.id === id);
        const skeleton: ProjectData = {
          id,
          name: meta?.name || 'Loading...',
          tasks: [
            { id: 't1', label: 'OHC - GPS (Embarkation & CIW)', category: 'CORE OPERATIONS', startWeek: 0, duration: 4, status: 'Completed', description: '', memberId: 'm1' },
            { id: 't2', label: 'OHC - Print Shop', category: 'SUPPORT & PRINTING', startWeek: 2, duration: 4, status: 'In Progress', description: '', memberId: 'm1' },
            { id: 't3', label: 'OHC - On the Go', category: 'LOGISTICS', startWeek: 4, duration: 4, status: 'Planned', description: '', memberId: 'm1' },
            { id: 't4', label: 'Frictionless Embarkation', category: 'CORE OPERATIONS', startWeek: 0, duration: 4, status: 'In Progress', description: '', memberId: 'm2' },
            { id: 't5', label: 'OHC - Security (ACP)', category: 'SUPPORT', startWeek: 2, duration: 4, status: 'In Progress', description: '', memberId: 'm2' },
            { id: 't6', label: 'OHC - Safety', category: 'SAFETY & FINANCE', startWeek: 4, duration: 4, status: 'Planned', description: '', memberId: 'm2' },
            { id: 't7', label: 'AffairWhere', category: 'HOSPITALITY', startWeek: 1, duration: 4, status: 'Completed', description: '', memberId: 'm3' },
            { id: 't8', label: 'POS - Mobility', category: 'GUEST RELATIONS', startWeek: 3, duration: 4, status: 'Planned', description: '', memberId: 'm3' },
            { id: 't9', label: 'Food Production Management', category: 'FINANCE', startWeek: 5, duration: 4, status: 'In Progress', description: '', memberId: 'm3' },
            { id: 't10', label: 'Housekeeping Tablets', category: 'INVENTORY', startWeek: 2, duration: 4, status: 'Planned', description: '', memberId: 'm4' },
            { id: 't11', label: 'Safetyculture', category: 'SYSTEMS', startWeek: 4, duration: 4, status: 'Blocked', description: '', memberId: 'm4' },
            { id: 't12', label: 'Nex Gen Playground', category: 'DIGITAL', startWeek: 2, duration: 4, status: 'Planned', description: '', memberId: 'm5' },
            { id: 't13', label: 'Shipboard Asset Tracking', category: 'TRACKING', startWeek: 4, duration: 4, status: 'Planned', description: '', memberId: 'm5' },
          ],
          members: INITIAL_MEMBERS,
          systems: INITIAL_SYSTEMS,
          issues: INITIAL_ISSUES,
          configReportRows: INITIAL_CONFIG_REPORT_ROWS,
          startDate: '2026-01-05',
          updatedAt: 0
        };
        setProject(skeleton);
        updatedAtRef.current = 0;
      }
      
      // The useEffect for Firebase will re-run because project.id changed
    } catch (e) {
      console.error("Switch Project Error:", e);
      setSyncStatus('error');
    }
  };

  const createNewProject = (name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);
    const newMeta = { id, name };
    
    const newProj: ProjectData = {
      id,
      name,
      tasks: [],
      members: INITIAL_MEMBERS,
      systems: INITIAL_SYSTEMS,
      issues: INITIAL_ISSUES,
      startDate: '2026-01-05',
      updatedAt: Date.now()
    };
    
    const updatedProjectsList = [...projects, newMeta];
    setProjects(updatedProjectsList);
    setProject(newProj);
    updatedAtRef.current = newProj.updatedAt;
    
    // Update Firebase
    set(ref(db, 'nbdt/projects_list'), updatedProjectsList);
    set(ref(db, `nbdt/projects_data/${id}`), newProj);
    
    setIsProjectMenuOpen(false);
  };

  const copyProject = (id: string) => {
    const sourceMeta = projects.find(p => p.id === id);
    if (!sourceMeta) return;

    const newId = `${id}-copy-${Date.now().toString().slice(-4)}`;
    const newName = `${sourceMeta.name} (Copy)`;
    
    // Get source data
    let sourceData: ProjectData;
    if (id === project.id) {
      sourceData = { ...project };
    } else {
      const saved = localStorage.getItem(`nbdt_project_${id}`);
      if (saved) {
        sourceData = JSON.parse(saved);
      } else {
        return;
      }
    }

    const newData: ProjectData = {
      ...sourceData,
      id: newId,
      name: newName,
      updatedAt: Date.now()
    };

    const updatedProjectsList = [...projects, { id: newId, name: newName }];
    setProjects(updatedProjectsList);
    setProject(newData);
    
    // Update Firebase
    set(ref(db, 'nbdt/projects_list'), updatedProjectsList);
    set(ref(db, `nbdt/projects_data/${newId}`), newData);
    
    setIsProjectMenuOpen(false);
  };

  const renameProject = (id: string, newName: string) => {
    const updatedProjectsList = projects.map(p => p.id === id ? { ...p, name: newName } : p);
    setProjects(updatedProjectsList);
    
    if (id === project.id) {
      handleAction(prev => ({ ...prev, name: newName }));
    } else {
      // If not current project, we still need to update its data in Firebase if it exists
      get(ref(db, `nbdt/projects_data/${id}`)).then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          set(ref(db, `nbdt/projects_data/${id}`), { ...data, name: newName, updatedAt: Date.now() });
        }
      });
    }
    
    set(ref(db, 'nbdt/projects_list'), updatedProjectsList);
    setEditingProjectId(null);
  };

  const deleteProject = (id: string) => {
    if (projects.length <= 1) return;

    const remainingProjects = projects.filter(p => p.id !== id);
    setProjects(remainingProjects);
    
    // Update Firebase
    set(ref(db, 'nbdt/projects_list'), remainingProjects);
    remove(ref(db, `nbdt/projects_data/${id}`));
    
    if (id === project.id) {
      const nextProj = remainingProjects[0];
      if (nextProj) switchProject(nextProj.id);
    }
    setDeletingProjectId(null);
  };

  const handleAction = (updater: (prev: ProjectData) => ProjectData) => {
    const next = updater(project);
    setProject(next);
    broadcastState(next);
  };

  const exportConfigReport = () => {
    const rows = project.configReportRows || INITIAL_CONFIG_REPORT_ROWS;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Configuration Report");
    XLSX.writeFile(workbook, `${project.name}_Configuration_Report.xlsx`);
  };

  const importConfigReport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (jsonData.length > 0) {
          const processedData: ConfigReportRow[] = jsonData.map((row, index) => ({
            id: row.id?.toString() || `imported-${Date.now()}-${index}`,
            bc: (['green', 'orange', 'red', 'none'].includes(row.bc) ? row.bc : 'none') as any,
            rd: (['green', 'orange', 'red', 'none'].includes(row.rd) ? row.rd : 'none') as any,
            system: row.system?.toString() || 'Unnamed System',
            qti: Number(row.qti) || 0,
            venue: row.venue?.toString() || '',
            device: row.device?.toString() || '',
            bcDone: Number(row.bcDone) || 0,
            rdDone: Number(row.rdDone) || 0,
            aw: (['green', 'orange', 'red', 'none'].includes(row.aw) ? row.aw : 'none') as any,
            cyber: (['Approved', 'Review', 'Blocked', 'N/A'].includes(row.cyber) ? row.cyber : 'Review') as any,
            assignee: row.assignee?.toString() || 'Unassigned',
            active: row.active === true || row.active === 'true'
          }));

          handleAction(prev => ({ ...prev, configReportRows: processedData }));
        }
      } catch (err) {
        console.error("Import Error:", err);
        alert("Failed to import report. Please check the file format.");
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    if (e.target) e.target.value = '';
  };

  const updateMemberName = (id: string, name: string) => {
    handleAction(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, name: name.toUpperCase() } : m)
    }));
  };

  const saveTask = (t: RoadmapTask) => {
    handleAction(prev => ({
      ...prev,
      tasks: prev.tasks.some(task => task.id === t.id) 
        ? prev.tasks.map(item => item.id === t.id ? t : item) 
        : [...prev.tasks, t]
    }));
    setDraftTask(null);
  };

  const toggleCheckSheetItem = (systemId: string, section: keyof CheckSheetData, itemId: string) => {
    if (!isAdmin) return;
    
    const updateSystem = (sys: SystemInfo) => {
      if (sys.id !== systemId) return sys;
      
      const data = sys.checkSheetData || DEFAULT_CHECKSHEET;
      const sectionItems = data[section].map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      
      return {
        ...sys,
        checkSheetData: {
          ...data,
          [section]: sectionItems
        }
      };
    };

    handleAction(prev => ({
      ...prev,
      systems: prev.systems.map(updateSystem)
    }));

    if (activeCheckSheetSys && activeCheckSheetSys.id === systemId) {
      setActiveCheckSheetSys(updateSystem(activeCheckSheetSys));
    }
  };

  const addCheckSheetItem = (systemId: string, section: keyof CheckSheetData, label: string) => {
    if (!isAdmin || !label.trim()) return;
    
    const updateSystem = (sys: SystemInfo) => {
      if (sys.id !== systemId) return sys;
      const data = sys.checkSheetData || DEFAULT_CHECKSHEET;
      const newItem = { id: Math.random().toString(36).substr(2, 9), label, completed: false };
      return {
        ...sys,
        checkSheetData: {
          ...data,
          [section]: [...data[section], newItem]
        }
      };
    };

    handleAction(prev => ({
      ...prev,
      systems: prev.systems.map(updateSystem)
    }));

    if (activeCheckSheetSys && activeCheckSheetSys.id === systemId) {
      setActiveCheckSheetSys(updateSystem(activeCheckSheetSys));
    }
  };

  const removeCheckSheetItem = (systemId: string, section: keyof CheckSheetData, itemId: string) => {
    if (!isAdmin) return;
    
    const updateSystem = (sys: SystemInfo) => {
      if (sys.id !== systemId) return sys;
      const data = sys.checkSheetData || DEFAULT_CHECKSHEET;
      return {
        ...sys,
        checkSheetData: {
          ...data,
          [section]: data[section].filter(i => i.id !== itemId)
        }
      };
    };

    handleAction(prev => ({
      ...prev,
      systems: prev.systems.map(updateSystem)
    }));

    if (activeCheckSheetSys && activeCheckSheetSys.id === systemId) {
      setActiveCheckSheetSys(updateSystem(activeCheckSheetSys));
    }
  };

  const reorderCheckSheetItems = (systemId: string, section: keyof CheckSheetData, oldIndex: number, newIndex: number) => {
    if (!isAdmin) return;
    
    const updateSystem = (sys: SystemInfo) => {
      if (sys.id !== systemId) return sys;
      const data = sys.checkSheetData || DEFAULT_CHECKSHEET;
      const sectionItems = arrayMove(data[section], oldIndex, newIndex);
      return {
        ...sys,
        checkSheetData: {
          ...data,
          [section]: sectionItems
        }
      };
    };

    handleAction(prev => ({
      ...prev,
      systems: prev.systems.map(updateSystem)
    }));

    if (activeCheckSheetSys && activeCheckSheetSys.id === systemId) {
      setActiveCheckSheetSys(updateSystem(activeCheckSheetSys));
    }
  };

  const saveSystem = (s: SystemInfo) => {
    handleAction(prev => ({
      ...prev,
      systems: prev.systems.some(item => item.id === s.id) 
        ? prev.systems.map(item => item.id === s.id ? s : item) 
        : [...prev.systems, s]
    }));
    setDraftSystem(null);
    setActiveCheckSheetSys(null);
    setActiveAppListSys(null);
    setActiveNamingConventionSys(null);
    setActiveLessonsLearnedSys(null);
  };

  const saveIssue = (i: Issue) => {
    handleAction(prev => ({
      ...prev,
      issues: prev.issues.some(item => item.id === i.id) 
        ? prev.issues.map(item => item.id === i.id ? i : item) 
        : [...prev.issues, i]
    }));
    setDraftIssue(null);
  };

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const filteredSystems = useMemo(() => {
    return project.systems.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(systemSearch.toLowerCase()) || 
        (s.deviceType || '').toLowerCase().includes(systemSearch.toLowerCase()) ||
        (s.osVersion || '').toLowerCase().includes(systemSearch.toLowerCase());
      
      const osChoices = ['Windows', 'Linux', 'iOS', 'Android'];
      const netChoices = ['WiFi', 'Wired'];

      const activeOsFilters = activeFilters.filter(f => osChoices.includes(f));
      const activeNetFilters = activeFilters.filter(f => netChoices.includes(f));

      // OS check: exact match against filter list
      const osMatch = activeOsFilters.length === 0 || activeOsFilters.includes(s.os);
      
      // Network check: robust fuzzy matching for WiFi/Wired
      const netMatch = activeNetFilters.length === 0 || activeNetFilters.some(f => {
        const netValue = (s.network || '').toLowerCase();
        const filterValue = f.toLowerCase();
        if (filterValue === 'wifi') {
            return netValue.includes('wifi') || netValue.includes('wi-fi') || netValue.includes('wireless');
        }
        if (filterValue === 'wired') {
            return netValue.includes('wired') || netValue.includes('cable') || netValue.includes('ethernet');
        }
        return netValue.includes(filterValue);
      });

      const assigneeMatch = !assigneeFilter || s.assigneeId === assigneeFilter;

      return matchesSearch && osMatch && netMatch && assigneeMatch;
    });
  }, [project.systems, systemSearch, activeFilters, assigneeFilter]);

  const filteredIssues = useMemo(() => {
    return project.issues.filter(i => {
      const matchesSearch = i.title.toLowerCase().includes(issueSearch.toLowerCase()) || 
        i.description.toLowerCase().includes(issueSearch.toLowerCase());
      
      const statusMatch = !issueStatusFilter || i.status === issueStatusFilter;
      const severityMatch = !issueSeverityFilter || i.severity === issueSeverityFilter;
      const assigneeMatch = !assigneeFilter || i.assigneeId === assigneeFilter;
      
      return matchesSearch && statusMatch && severityMatch && assigneeMatch;
    });
  }, [project.issues, issueSearch, issueStatusFilter, issueSeverityFilter, assigneeFilter]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleIssueDragStart = (event: DragStartEvent) => {
    setActiveIssueId(event.active.id as string);
  };

  const handleIssueDragEnd = (event: DragEndEvent) => {
    setActiveIssueId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the issue being dragged
    const activeIssue = project.issues.find(i => i.id === activeId);
    if (!activeIssue) return;

    // Check if we dropped over a column or another card
    const statuses: IssueStatus[] = ['Open', 'Investigating', 'Waiting for Parts', 'Resolved'];
    let newStatus: IssueStatus | null = null;

    if (statuses.includes(overId as any)) {
      newStatus = overId as IssueStatus;
    } else {
      const overIssue = project.issues.find(i => i.id === overId);
      if (overIssue) {
        newStatus = overIssue.status;
      }
    }

    if (newStatus && newStatus !== activeIssue.status) {
      const nextIssues = project.issues.map(i => 
        i.id === activeId ? { ...i, status: newStatus!, updatedAt: Date.now() } : i
      );
      handleAction(p => ({ ...p, issues: nextIssues }));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="bg-[#020617] w-screen h-screen overflow-hidden flex text-slate-100 font-sans">
      {copyFeedback && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[110] bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl animate-fadeIn">
          Copied to clipboard!
        </div>
      )}

      {/* Sync Status Overlay Removed - Moved to Sidebar */}


      {/* Admin Toggle */}
      <div className={cn(
        "fixed top-6 right-6 z-[100] transition-opacity duration-300",
        (activeTab === 'roadmap' || activeTab === 'issues' || activeTab === 'systems' || activeTab === 'config-report') && "opacity-0 pointer-events-none"
      )}>
        <button 
          onClick={() => {
            if (isAdmin) {
              setIsAdmin(false);
            } else {
              setShowAdminAuthModal(true);
              setAdminPassInput('');
            }
          }}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-300 cursor-pointer ${
            isAdmin 
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 backdrop-blur-md'
          }`}
        >
          {isAdmin ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          <span className="text-[10px] font-black tracking-widest uppercase">
            {isAdmin ? 'Admin Mode' : 'View Mode'}
          </span>
          <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isAdmin ? 'bg-indigo-400' : 'bg-slate-700'}`}>
            <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all duration-300 ${isAdmin ? 'left-5' : 'left-1'}`} />
          </div>
        </button>
      </div>

      <aside className={`${isSidebarExpanded ? 'w-72' : 'w-20'} border-r border-slate-900 bg-[#020617] flex flex-col py-6 gap-8 shrink-0 z-50 transition-all duration-300 ease-in-out overflow-hidden`}>
         <div className="relative px-4">
            <button 
              onClick={() => setIsSidebarExpanded(true)}
              className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-800/50 transition-all group"
            >
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Ship className="text-white w-6 h-6" />
               </div>
               {isSidebarExpanded && (
                 <div className="flex flex-col items-start overflow-hidden text-left flex-1" onClick={(e) => { e.stopPropagation(); setIsProjectMenuOpen(!isProjectMenuOpen); }}>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">Project</span>
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-black text-sm tracking-tight text-white truncate flex-1">{project.name}</span>
                      <ChevronDown size={14} className={`text-slate-500 transition-transform ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
                    </div>
                 </div>
               )}
            </button>

            {isProjectMenuOpen && isSidebarExpanded && (
              <div className="absolute left-4 right-4 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {projects.map(p => (
                    <div key={p.id} className="group relative">
                      {editingProjectId === p.id ? (
                        <div className="p-2 flex items-center gap-2">
                          <input 
                            autoFocus
                            className="bg-slate-950 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs text-white w-full outline-none"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') renameProject(p.id, newProjectName);
                              if (e.key === 'Escape') setEditingProjectId(null);
                            }}
                            onBlur={() => renameProject(p.id, newProjectName)}
                          />
                        </div>
                      ) : (
                        <div 
                          role="button"
                          tabIndex={0}
                          onClick={() => switchProject(p.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') switchProject(p.id); }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${p.id === project.id ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${p.id === project.id ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                          <span className="text-xs font-bold truncate flex-1 text-left">{p.name}</span>
                          
                          {isAdmin && (
                            <div className="hidden group-hover:flex items-center gap-1">
                              {deletingProjectId === p.id ? (
                                <div className="flex items-center gap-1 animate-in fade-in zoom-in-95">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                                    className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded hover:bg-red-600 transition-colors uppercase"
                                  >
                                    Confirm
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setDeletingProjectId(null); }}
                                    className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[8px] font-black rounded hover:bg-slate-600 transition-colors uppercase"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div onClick={(e) => { e.stopPropagation(); copyProject(p.id); }} className="p-1 hover:text-indigo-400 transition-colors" title="Copy"><Copy size={12} /></div>
                                  <div onClick={(e) => { e.stopPropagation(); setEditingProjectId(p.id); setNewProjectName(p.name); }} className="p-1 hover:text-indigo-400 transition-colors" title="Rename"><Edit3 size={12} /></div>
                                  {projects.length > 1 && (
                                    <div onClick={(e) => { e.stopPropagation(); setDeletingProjectId(p.id); }} className="p-1 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={12} /></div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <div className="p-2 border-t border-slate-800 bg-slate-900/50">
                    {isCreatingProject ? (
                      <div className="p-2 flex flex-col gap-2">
                        <input 
                          autoFocus
                          className="bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-2 text-xs text-white w-full outline-none"
                          placeholder="Project Name..."
                          value={newProjectInput}
                          onChange={e => setNewProjectInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newProjectInput.trim()) {
                              createNewProject(newProjectInput.trim());
                              setIsCreatingProject(false);
                              setNewProjectInput('');
                            }
                            if (e.key === 'Escape') {
                              setIsCreatingProject(false);
                              setNewProjectInput('');
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              if (newProjectInput.trim()) {
                                createNewProject(newProjectInput.trim());
                                setIsCreatingProject(false);
                                setNewProjectInput('');
                              }
                            }}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors"
                          >
                            Create
                          </button>
                          <button 
                            onClick={() => {
                              setIsCreatingProject(false);
                              setNewProjectInput('');
                            }}
                            className="px-3 py-2 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsCreatingProject(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-indigo-400 hover:bg-indigo-500/10 transition-all text-xs font-black uppercase tracking-widest"
                      >
                        <Plus size={14} /> New Project
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
         </div>

         <nav className="flex flex-col gap-4 px-4">
            <button onClick={() => setActiveTab('roadmap')} className={`flex items-center gap-4 p-2 rounded-lg transition-all ${activeTab === 'roadmap' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/50'}`}>
               <Calendar className="w-6 h-6 shrink-0" />
               {isSidebarExpanded && <span className="text-xs font-black tracking-widest uppercase truncate">Roadmap</span>}
            </button>
            <button onClick={() => setActiveTab('systems')} className={`flex items-center gap-4 p-2 rounded-lg transition-all ${activeTab === 'systems' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/50'}`}>
               <Database className="w-6 h-6 shrink-0" />
               {isSidebarExpanded && <span className="text-xs font-black tracking-widest uppercase truncate">Systems</span>}
            </button>
            <button onClick={() => setActiveTab('issues')} className={`flex items-center gap-4 p-2 rounded-lg transition-all ${activeTab === 'issues' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/50'}`}>
               <AlertCircle className="w-6 h-6 shrink-0" />
               {isSidebarExpanded && <span className="text-xs font-black tracking-widest uppercase truncate">Issue Tracker</span>}
            </button>
            <button onClick={() => setActiveTab('config-report')} className={`flex items-center gap-4 p-2 rounded-lg transition-all ${activeTab === 'config-report' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/50'}`}>
               <FileBarChart className="w-6 h-6 shrink-0" />
               {isSidebarExpanded && <span className="text-xs font-black tracking-widest uppercase truncate">Config Report</span>}
            </button>
             {isAdmin && (
               <button onClick={() => setActiveTab('sync')} className={`flex items-center gap-4 p-2 rounded-lg transition-all ${activeTab === 'sync' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800/50'}`}>
                  <Cloud className="w-6 h-6 shrink-0" />
                  {isSidebarExpanded && <span className="text-xs font-black tracking-widest uppercase truncate">Collab Hub</span>}
               </button>
             )}
         </nav>

         <div className="mt-auto px-3 pb-4 flex flex-col gap-4">
            {/* Minimalist Sync Status */}
            <div className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-500 bg-slate-900/30",
              !syncConnected ? 'border-red-500/30' : 'border-slate-800/50'
            )}>
              <div className="shrink-0 relative">
                {!syncConnected ? <WifiOff size={12} className="text-red-400" /> :
                 syncStatus === 'syncing' ? <RefreshCw size={12} className="text-blue-400 animate-spin" /> : 
                 syncStatus === 'updated' ? <CheckCircle2 size={12} className="text-emerald-500" /> : 
                 <Database size={12} className="text-slate-500" />}
                
                {/* Connection dot when collapsed */}
                {!isSidebarExpanded && syncConnected && (
                  <div className={cn(
                    "absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full",
                    syncStatus === 'syncing' ? "bg-blue-400 animate-pulse" : "bg-emerald-500 animate-pulse"
                  )} />
                )}
              </div>
              {isSidebarExpanded && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className={cn(
                    "text-[8px] font-black tracking-widest uppercase truncate",
                    !syncConnected ? 'text-red-400' : 'text-slate-500'
                  )}>
                    {!syncConnected ? 'Offline' :
                     syncStatus === 'syncing' ? 'Syncing...' : 
                     'Hub Connected'}
                  </span>
                  {syncConnected && (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0 ml-2",
                      syncStatus === 'syncing' ? "bg-blue-400 animate-pulse" : "bg-emerald-500 animate-pulse"
                    )} />
                  )}
                </div>
              )}
            </div>

            <button 
               onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} 
               className="w-full flex items-center gap-4 p-2 text-slate-600 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
            >
               {isSidebarExpanded ? <ChevronLeft className="w-6 h-6 shrink-0" /> : <Menu className="w-6 h-6 shrink-0" />}
               {isSidebarExpanded && <span className="text-[10px] font-black tracking-widest uppercase truncate">Collapse</span>}
            </button>
         </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'roadmap' && (
          <div className="flex-1 flex flex-col overflow-hidden animate-fadeIn">
            <header className="px-10 py-6 flex items-center justify-between shrink-0 border-b border-slate-900/50">
              <div className="flex items-center gap-8">
                <h1 className="text-3xl font-bold tracking-tighter text-white">Project Roadmap</h1>
              </div>

              <div className="flex items-center gap-6">
                {/* Admin Toggle (Inline for Roadmap) */}
                <button 
                  onClick={() => {
                    if (isAdmin) {
                      setIsAdmin(false);
                    } else {
                      setShowAdminAuthModal(true);
                      setAdminPassInput('');
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-300 cursor-pointer ${
                    isAdmin 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 backdrop-blur-md'
                  }`}
                >
                  {isAdmin ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    {isAdmin ? 'Admin Mode' : 'View Mode'}
                  </span>
                  <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isAdmin ? 'bg-indigo-400' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all duration-300 ${isAdmin ? 'left-5' : 'left-1'}`} />
                  </div>
                </button>

                {/* Week Navigation */}
                <div className="flex items-center bg-[#0a0f1d] border border-slate-800 rounded-2xl p-1 gap-2">
                   <button onClick={handlePrevWeek} disabled={currentStartWeek <= 1} className="p-2 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors"><ChevronLeft size={18} /></button>
                   <span className="text-[10px] font-black tracking-widest min-w-[120px] text-center uppercase text-slate-300">WEEKS {currentStartWeek}-{Math.min(currentStartWeek + 5, TOTAL_WEEKS)}</span>
                   <button onClick={handleNextWeek} disabled={currentStartWeek >= TOTAL_WEEKS} className="p-2 hover:bg-slate-800 rounded-xl disabled:opacity-20 transition-colors"><ChevronRight size={18} /></button>
                </div>
              </div>
            </header>

            {/* Sub-header with legend and jump button */}
            <div className="px-10 py-4 flex items-center justify-between border-b border-slate-900/30 bg-slate-950/20">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-500 tracking-[0.3em] uppercase opacity-80">Master Delivery (28 Weeks)</span>
                <div className="h-px w-10 bg-slate-800"></div>
                <button onClick={() => scrollToWeek(todayWeekIndex + 1)} className="flex items-center gap-2 text-orange-500 text-[11px] font-black tracking-widest hover:text-orange-400 transition-colors">
                  <Navigation className="w-4 h-4 rotate-45 fill-current" /> JUMP TO TODAY
                </button>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Planned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Blocked</span>
                </div>
              </div>
            </div>

            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-x-auto overflow-y-auto bg-[#020617] no-scrollbar scroll-smooth"
            >
               <div className="inline-block relative min-h-full" style={{ width: (TOTAL_WEEKS * WEEK_WIDTH) + MEMBER_LABEL_WIDTH }}>
                  {daysFromStart >= 0 && daysFromStart <= TOTAL_WEEKS * 7 && (
                    <div className="absolute top-0 bottom-0 w-[1.5px] bg-orange-500/50 z-[55] pointer-events-none" style={{ left: MEMBER_LABEL_WIDTH + ((daysFromStart + 0.5) * (WEEK_WIDTH / 7)) }}>
                       {/* Today Indicator Label */}
                       <div className="sticky top-2 left-0 -translate-x-1/2 flex flex-col items-center z-[70]">
                          <span className="text-[8px] font-black text-orange-500 uppercase tracking-[0.3em] drop-shadow-sm">Today</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                       </div>
                       {/* Subtle Line Glow */}
                       <div className="h-full w-full bg-gradient-to-b from-orange-500/20 via-orange-500/5 to-transparent" />
                    </div>
                  )}

                  <div className="flex border-b border-slate-800/30 sticky top-0 z-50 bg-[#020617]/95 backdrop-blur-xl h-40">
                     <div className="sticky left-0 z-[60] bg-[#020617] border-r border-slate-800/50 w-[220px] flex items-center justify-center px-4">
                        <div className="w-full bg-[#0a0f1d] border border-slate-800 p-4 rounded-2xl shadow-xl">
                           <h3 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mb-2 uppercase opacity-60">Timeline Start</h3>
                           <div className="relative group/date">
                             <input 
                               type="date" 
                               value={project.startDate} 
                               readOnly={!isAdmin}
                               onChange={(e) => isAdmin && handleAction(p => ({ ...p, startDate: e.target.value }))} 
                               onClick={(e) => isAdmin && (e.target as any).showPicker?.()} 
                               className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-2 pr-10 text-[11px] font-bold text-indigo-400 outline-none transition-all appearance-none ${isAdmin ? 'cursor-pointer hover:border-indigo-500/50' : 'cursor-default'}`} 
                             />
                             {isAdmin && <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500/50 group-hover/date:text-indigo-400 pointer-events-none transition-colors" size={14} />}
                           </div>
                        </div>
                     </div>
                     {Array.from({ length: TOTAL_WEEKS }).map((_, i) => {
                       const isCurrentWeek = i === todayWeekIndex;
                       const weekStart = parseLocalDate(project.startDate);
                       weekStart.setDate(weekStart.getDate() + (i * 7));
                       
                       const days = Array.from({ length: 7 }).map((_, dayIdx) => {
                         const d = new Date(weekStart);
                         d.setDate(d.getDate() + dayIdx);
                         return d.getDate();
                       });

                       return (
                        <div key={i} className={`flex-shrink-0 border-r border-slate-800/20 w-[200px] flex flex-col items-center justify-center relative transition-all duration-500 ${isCurrentWeek ? 'bg-indigo-500/[0.03]' : ''}`}>
                          {isCurrentWeek && (
                            <>
                              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-80" />
                              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                            </>
                          )}
                          <div className="flex flex-col items-center mb-6">
                            <span className={`text-xs font-black mb-1 transition-colors duration-500 ${isCurrentWeek ? 'text-white scale-110' : 'text-slate-400'}`}>WEEK {i + 1}</span>
                            <span className={`text-[10px] font-bold font-mono tracking-tight transition-colors duration-500 ${isCurrentWeek ? 'text-indigo-400' : 'text-slate-600'}`}>{getWeekRange(project.startDate, i)}</span>
                          </div>

                          {/* Days Row */}
                          <div className="absolute bottom-0 left-0 right-0 flex border-t border-slate-800/30 h-8 bg-slate-950/20">
                            {days.map((day, dayIdx) => (
                              <div key={dayIdx} className="flex-1 flex items-center justify-center border-r border-slate-800/10 last:border-r-0 relative group/day-label">
                                 <span className="text-[9px] font-bold text-slate-500 group-hover/day-label:text-indigo-400 transition-colors">{day.toString().padStart(2, '0')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                       );
                     })}
                  </div>

                   {/* Milestones Row */}
                  <div className="h-48 border-b-2 border-indigo-500/20 flex items-center relative bg-indigo-500/[0.02]">
                     <div className="sticky left-0 z-[50] bg-[#020617] border-r border-indigo-500/20 w-[220px] flex items-center justify-center px-4 h-full">
                        {isAdmin ? (
                          <button 
                            onClick={() => setDraftTask({ id: `m-${Date.now()}`, label: 'New Milestone', startWeek: currentStartWeek - 1, duration: 1, status: 'Planned', description: '', memberId: 'milestones', isMilestone: true })} 
                            className="w-full py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg text-[11px] font-medium tracking-tight shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                             <Flag size={14} /> Milestones
                          </button>
                        ) : (
                          <div className="w-full py-2.5 bg-indigo-600/90 text-white rounded-lg text-[11px] font-medium tracking-tight shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                             <Flag size={14} /> Milestones
                          </div>
                        )}
                     </div>
                     {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
                        <div key={i} className={`flex-shrink-0 border-r border-indigo-500/10 w-[200px] h-full relative z-10 flex items-center justify-center group/ms-cell ${isAdmin && dragOverCell?.memberId === 'milestones' && dragOverCell?.week === i ? 'bg-indigo-500/20' : ''}`} onDragOver={(e) => { if (!isAdmin) return; e.preventDefault(); setDragOverCell({ memberId: 'milestones', week: i }); }} onDragLeave={() => setDragOverCell(null)} onDrop={(e) => { if (!isAdmin) return; e.preventDefault(); const taskId = e.dataTransfer.getData('text/plain'); handleAction(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, memberId: 'milestones', startWeek: i, isMilestone: true } : t) })); setDraggingTaskId(null); setDragOverCell(null); }}>
                          {isAdmin && <button onClick={() => setDraftTask({ id: `m-${Date.now()}`, label: 'New Milestone', startWeek: i, duration: 1, status: 'Planned', description: '', memberId: 'milestones', isMilestone: true })} className="opacity-0 group-hover/ms-cell:opacity-100 p-2 bg-indigo-600 rounded-full text-white transition-all z-20 scale-75 hover:scale-100"><Plus size={16}/></button>}
                        </div>
                     ))}
                     {project.tasks.filter(t => t.isMilestone).map(m => {
                        const mDate = m.date ? parseLocalDate(m.date) : parseLocalDate(project.startDate);
                        if (!m.date) mDate.setDate(mDate.getDate() + (m.startWeek * 7));
                        const mDateStr = mDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
                        
                        const mConfig = m.status === 'Completed' ? { accent: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' }
                          : m.status === 'In Progress' ? { accent: 'bg-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]' }
                          : m.status === 'Blocked' ? { accent: 'bg-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]' }
                          : { accent: 'bg-slate-500', bg: 'bg-slate-700/10', border: 'border-slate-600/30', text: 'text-slate-400', glow: 'shadow-[0_0_20px_rgba(100,116,139,0.2)]' };

                        return (
                          <div 
                            key={m.id} 
                            draggable={isAdmin} 
                            onDragStart={(e) => { if (!isAdmin) return; setDraggingTaskId(m.id); setHoveredTaskInfo(null); e.dataTransfer.setData('text/plain', m.id); }} 
                            onMouseEnter={(e) => setHoveredTaskInfo({ task: m, memberName: 'Milestones', config: mConfig, isMilestone: true, rect: e.currentTarget.getBoundingClientRect() })}
                            onMouseLeave={() => setHoveredTaskInfo(null)}
                            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-20 transition-all group/m hover:z-[500] ${draggingTaskId === m.id ? 'opacity-0' : 'opacity-100'} ${isAdmin ? 'cursor-move' : 'cursor-default'}`} 
                            style={{ left: MEMBER_LABEL_WIDTH + (m.startWeek * WEEK_WIDTH) + (WEEK_WIDTH / 2) }} 
                            onClick={() => isAdmin && setDraftTask(m)}
                          >
                             {/* Refined Flag Pin */}
                             <div className="relative flex flex-col items-center h-16 justify-end">
                                <div className={`w-8 h-8 rounded-full border-2 border-[#020617] flex items-center justify-center relative z-10 transition-all duration-500 group-hover/m:scale-110 group-hover/m:-translate-y-1 ${mConfig.accent} ${mConfig.glow}`}>
                                   <Flag size={12} className="text-white fill-white/20" />
                                   <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none" />
                                </div>
                                <div className={`w-[2px] h-6 -mt-1 bg-gradient-to-b from-current to-transparent opacity-40 group-hover/m:h-8 transition-all duration-500 ${mConfig.text.replace('text-', 'bg-')}`} />
                             </div>
                             
                             <div className="mt-1 bg-gradient-to-b from-[#0f172a]/95 to-[#020617]/95 backdrop-blur-2xl border border-white/10 rounded-2xl px-4 pt-4 pb-3 flex flex-col items-center shadow-[0_12px_40px_rgba(0,0,0,0.5)] min-w-[160px] h-[100px] group-hover/m:border-white/20 group-hover/m:from-[#1e293b]/95 group-hover/m:to-[#0f172a]/95 group-hover/m:-translate-y-1 group-hover/m:shadow-[0_25px_50px_rgba(0,0,0,0.7)] transition-all duration-500 relative">
                                {/* Subtle internal glow */}
                                <div className={`absolute -top-10 -left-10 w-24 h-24 rounded-full blur-3xl opacity-10 ${mConfig.accent}`} />
                                
                                <div className="w-full h-5 flex items-center justify-center relative z-10">
                                   <span className="text-[12px] font-semibold text-slate-100 tracking-tight truncate group-hover/m:text-white transition-colors duration-300">{m.label}</span>
                                </div>
                                <div className="w-full h-4 flex items-center justify-center mt-1 relative z-10">
                                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{mDateStr}</span>
                                </div>
                                
                                <div className="mt-auto flex items-center justify-center h-6 w-full relative z-10">
                                   {m.checklist && m.checklist.length > 0 ? (
                                      <div className="flex items-center gap-2 bg-white/5 rounded-full px-2.5 py-1 border border-white/5">
                                         <div className="flex -space-x-1">
                                            {m.checklist.slice(0, 4).map((item, i) => (
                                               <div key={item.id} className={`w-1.5 h-1.5 rounded-full border border-[#0a0f1d] ${item.completed ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} style={{ zIndex: 4-i }} />
                                            ))}
                                         </div>
                                         <span className="text-[9px] font-black tracking-tighter text-slate-400">
                                            {m.checklist.filter(i => i.completed).length}/{m.checklist.length}
                                         </span>
                                      </div>
                                   ) : (
                                      <div className={`w-12 h-1 rounded-full opacity-20 ${mConfig.accent}`} />
                                   )}
                                </div>
                             </div>
                          </div>
                        );
                     })}
                  </div>

                  {/* Team Members Grid */}
                  <div className="pb-40">
                     {project.members.map(member => (
                        <div 
                          key={member.id} 
                          className={`flex border-b border-slate-800/10 group relative h-[52px] transition-all duration-300 ${member.isLead && !member.isTeamLead ? 'bg-indigo-500/[0.04] border-indigo-500/10' : ''} ${selectedMemberId === member.id ? 'bg-indigo-500/10' : ''} ${selectedMemberId && selectedMemberId !== member.id ? 'opacity-40 grayscale-[0.5]' : ''}`}
                        >
                           <div className={`sticky left-0 z-40 w-[220px] flex items-center px-3 shrink-0 transition-all ${member.isLead && !member.isTeamLead ? 'bg-[#0a0f1d]' : 'bg-[#020617]'}`}>
                              <div 
                                className={`flex-1 flex items-center gap-3 group/member cursor-pointer h-10 px-3 rounded-l-md transition-all duration-500 relative overflow-hidden [mask-image:linear-gradient(to_right,black_50%,transparent_100%)] ${selectedMemberId === member.id ? 'bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'bg-white/[0.03] hover:bg-white/[0.06]'}`}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMemberRect(rect);
                                  setSelectedMemberId(member.id);
                                  setPanelPosition({ x: rect.right + 40, y: Math.max(20, Math.min(window.innerHeight - 500, rect.top - 100)) });
                                }}
                              >
                                 {/* Activity Indicator Bar */}
                                 <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-all duration-500 ${member.isTeamLead ? 'bg-orange-500' : member.isLead ? 'bg-indigo-500' : 'bg-slate-600'} ${selectedMemberId === member.id ? 'h-full top-0 bottom-0' : 'group-hover/member:h-4'}`} />

                                 {/* Fade out borders */}
                                 <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${selectedMemberId === member.id ? 'from-indigo-500/40' : 'from-white/10'} to-transparent`} />
                                 <div className={`absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r ${selectedMemberId === member.id ? 'from-indigo-500/40' : 'from-white/10'} to-transparent`} />
                                 <div className={`absolute top-0 left-0 bottom-0 w-[1px] ${selectedMemberId === member.id ? 'bg-indigo-500/40' : 'bg-white/10'}`} />

                                 {editingMemberId === member.id ? (
                                   <input autoFocus className="bg-slate-900 border border-indigo-500 text-[10px] font-black text-white p-1 rounded w-full outline-none uppercase" value={member.name} onChange={(e) => updateMemberName(member.id, e.target.value)} onBlur={() => setEditingMemberId(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingMemberId(null)} />
                                 ) : (
                                   <>
                                     {/* Integrated Project Count - Moved to Left with unique zone */}
                                     <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0 transition-all duration-500 relative z-10 border ${selectedMemberId === member.id ? 'bg-indigo-500/40 text-white border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover/member:bg-indigo-500/20 group-hover/member:text-white group-hover/member:border-indigo-500/40'}`}>
                                       <Layers size={10} className={`transition-colors ${selectedMemberId === member.id ? 'text-white' : 'text-indigo-400 group-hover/member:text-white'}`} />
                                       <span className="text-[9px] font-black tracking-tighter">
                                         {(userProjects[member.id] || []).length}
                                       </span>
                                     </div>

                                     <div className="flex flex-col flex-1 min-w-0 relative z-10">
                                       <span className={`text-[10px] font-black tracking-[0.1em] uppercase truncate transition-colors ${member.isTeamLead ? 'text-orange-500' : member.isLead ? 'text-indigo-400' : 'text-white group-hover/member:text-indigo-200'}`}>{member.name}</span>
                                     </div>

                                     {isAdmin && (
                                       <div className="flex opacity-0 group-hover/member:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 bg-[#020617]/90 backdrop-blur-md rounded-lg p-0.5 border border-white/10 shadow-xl z-50">
                                          <button onClick={(e) => { e.stopPropagation(); setEditingMemberId(member.id); }} className="p-1 text-slate-500 hover:text-blue-400 transition-colors"><Edit2 size={12}/></button>
                                          {!member.isLead && <button onClick={(e) => { e.stopPropagation(); handleAction(prev => ({ ...prev, members: prev.members.filter(m => m.id !== member.id) })); }} className="p-1 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={12}/></button>}
                                       </div>
                                     )}
                                   </>
                                 )}
                              </div>
                           </div>
                           {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
                            <div key={i} className={`flex-shrink-0 border-r w-[200px] h-full relative z-10 transition-colors ${member.isLead && !member.isTeamLead ? 'border-indigo-500/5' : 'border-slate-800/10'} ${dragOverCell?.memberId === member.id && dragOverCell?.week === i ? 'bg-indigo-500/20' : ''}`} onDragOver={(e) => { if (!isAdmin) return; e.preventDefault(); setDragOverCell({ memberId: member.id, week: i }); }} onDragLeave={() => setDragOverCell(null)} onDrop={(e) => { if (!isAdmin) return; e.preventDefault(); const taskId = e.dataTransfer.getData('text/plain'); handleAction(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, memberId: member.id, startWeek: i, isMilestone: false } : t) })); setDraggingTaskId(null); setDragOverCell(null); }}>
                               {isAdmin && <button onClick={() => setDraftTask({ id: `t-${Date.now()}`, label: 'NEW TASK', startWeek: i, duration: 1, status: 'Planned', description: '', memberId: member.id })} className="opacity-0 hover:opacity-100 absolute inset-0 flex items-center justify-center transition-all bg-indigo-500/5 transition-opacity"><Plus size={14} className="text-indigo-500" /></button>}
                            </div>
                          ))}
                          {project.tasks.filter(t => t.memberId === member.id && !t.isMilestone).map(task => {
                            const statusConfigs = {
                              'Completed': { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-50', glow: '' },
                              'In Progress': { dot: 'bg-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-50', glow: '' },
                              'Blocked': { dot: 'bg-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-50', glow: '' },
                              'Planned': { dot: 'bg-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-100', glow: '' }
                            };

                            let config = { ...statusConfigs[task.status] };

                            if (member.isTeamLead) {
                              config = { dot: 'bg-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-50', glow: '' };
                            } else if (member.isLead) {
                              config = { ...config, border: 'border-indigo-500/40', bg: 'bg-indigo-500/10', glow: '' };
                            }

                            return (
                              <div 
                                key={task.id} 
                                draggable={isAdmin} 
                                onDragStart={(e) => { if (!isAdmin) return; setDraggingTaskId(task.id); setHoveredTaskInfo(null); e.dataTransfer.setData('text/plain', task.id); }} 
                                onMouseEnter={(e) => setHoveredTaskInfo({ task, memberName: member.name, config, isMilestone: false, rect: e.currentTarget.getBoundingClientRect() })}
                                onMouseLeave={() => setHoveredTaskInfo(null)}
                                onClick={() => isAdmin && setDraftTask(task)} 
                                className={`absolute top-2 bottom-2 rounded-md border transition-all duration-500 z-20 group/task hover:z-[500] hover:scale-[1.01] hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.4)] overflow-hidden bg-[#0b1120] border-slate-800/60 ${isAdmin ? 'cursor-move' : 'cursor-default'} ${selectedMemberId && selectedMemberId !== member.id ? 'opacity-20 grayscale blur-[1px]' : task.status === 'Planned' ? 'opacity-70' : 'opacity-100'}`} 
                                style={{ left: MEMBER_LABEL_WIDTH + (task.startWeek * WEEK_WIDTH) + 8, width: (task.duration * WEEK_WIDTH) - 16 }}
                              >
                                {/* Accent Bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.dot}`} />

                                <div className="flex items-center w-full h-full px-3">
                                  <span className="text-[10px] font-normal truncate tracking-tight text-slate-400 group-hover/task:text-slate-200 transition-colors duration-300">{task.label}</span>
                                  
                                  {task.checklist && task.checklist.length > 0 && (
                                    <div className="flex items-center gap-1.5 ml-auto pl-2 opacity-30">
                                      <span className="text-[7px] font-medium tracking-tight text-slate-500">
                                        {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                       </div>
                     ))}
                      {isAdmin && (
                        <button onClick={() => { const nextNum = project.members.filter(m => m.id.startsWith('nbdt')).length + 1; const newMember: NDBTMember = { id: `nbdt-${Date.now()}`, name: `NBDT ${String(nextNum).padStart(2, '0')}` }; handleAction(prev => ({ ...prev, members: [...prev.members, newMember] })); }} className="w-[220px] sticky left-0 py-3 border-b border-slate-800/20 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/5 text-[11px] font-medium tracking-tight flex items-center justify-center gap-2 transition-all">
                           <UserPlus size={12} /> Add Team Member
                        </button>
                      )}
                  </div>
               </div>
            </div>
          </div>
        )}


        {activeTab === 'systems' && (
          <div className="px-10 py-6 flex flex-col h-full animate-fadeIn overflow-hidden w-full">
            <header className="flex items-center justify-between mb-8 shrink-0">
               <div>
                  <h1 className="text-3xl font-bold tracking-tighter text-white">System Registry</h1>
                  <p className="text-slate-500 text-sm font-medium">{project.systems.length} systems registered in the hub.</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search systems..." 
                      className="bg-[#0a0f1d] border border-slate-800 rounded-xl py-3 pl-12 pr-6 text-xs outline-none focus:border-indigo-500 w-[240px] transition-all text-white placeholder:text-slate-600" 
                      value={systemSearch} 
                      onChange={(e) => setSystemSearch(e.target.value)} 
                    />
                  </div>

                  {/* Admin Toggle (Local for Systems) */}
                  <button 
                    onClick={() => {
                      if (isAdmin) {
                        setIsAdmin(false);
                      } else {
                        setShowAdminAuthModal(true);
                        setAdminPassInput('');
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                      isAdmin 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 backdrop-blur-md'
                    }`}
                  >
                    {isAdmin ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                    <span className="text-[10px] font-black tracking-widest uppercase">
                      {isAdmin ? 'Admin Mode' : 'View Mode'}
                    </span>
                    <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isAdmin ? 'bg-indigo-400' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all duration-300 ${isAdmin ? 'left-5' : 'left-1'}`} />
                    </div>
                  </button>

                  {isAdmin && (
                    <button 
                      onClick={() => setDraftSystem({ 
                        id: `sys-${Date.now()}`, 
                        name: 'NEW SYSTEM', 
                        deviceType: '', 
                        deviceCategory: 'PC',
                        os: 'Windows',
                        osVersion: '',
                        network: 'Wired',
                        vlan: '',
                        serviceAccount: '',
                        userAccount: '',
                        logonType: '',
                        ipScope: '',
                        ipReservation: '',
                        domainOU: '',
                        airWatchTags: '',
                        status: 'Active',
                        assigneeId: ''
                      })} 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Plus size={16}/> Add System
                    </button>
                  )}
               </div>
            </header>

            {/* Red Filters Bar */}
            <div className="mb-10 p-3 bg-indigo-500/[0.02] border border-slate-800/60 rounded-[2rem] flex items-center gap-4 shrink-0 overflow-x-auto no-scrollbar shadow-inner">
               <div className="flex items-center gap-3 px-6 py-2 border-r border-slate-800/80">
                  <Filter size={16} className="text-indigo-400" />
                  <span className="text-[11px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">Library Filters</span>
               </div>
               <div className="flex items-center gap-2.5 px-2">
                  {['Windows', 'iOS', 'Android', 'Linux', 'WiFi', 'Wired'].map(f => {
                    const isActive = activeFilters.includes(f);
                    return (
                      <button 
                        key={f} 
                        onClick={() => toggleFilter(f)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                          isActive 
                          ? 'bg-indigo-600 border-indigo-400 text-white scale-[1.05]' 
                          : 'bg-slate-900/40 border-slate-800/50 text-slate-500 hover:text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}

                  <div className="ml-4 flex items-center gap-3 px-4 border-l border-slate-800/80">
                    <User size={14} className={assigneeFilter ? "text-indigo-400" : "text-slate-600"} />
                    <select 
                      value={assigneeFilter} 
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      className={`bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer transition-colors ${
                        assigneeFilter ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <option value="" className="bg-[#0a0f1d]">All Assignees</option>
                      {project.members.map(m => (
                        <option key={m.id} value={m.id} className="bg-[#0a0f1d]">{m.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {(activeFilters.length > 0 || assigneeFilter) && (
                    <button 
                      onClick={() => { setActiveFilters([]); setAssigneeFilter(''); }}
                      className="ml-6 flex items-center gap-2 px-4 py-2 group"
                    >
                      <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                        <X size={12} strokeWidth={3} />
                      </div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-red-400 transition-colors">Reset Hub Filters</span>
                    </button>
                  )}
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-4 no-scrollbar">
               <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 pb-20">
                  {filteredSystems.map(sys => (
                    <SystemRegistryCard 
                      key={sys.id}
                      sys={sys}
                      project={project}
                      isAdmin={isAdmin}
                      setDraftSystem={setDraftSystem}
                      setActiveCheckSheetSys={setActiveCheckSheetSys}
                      setActiveAppListSys={setActiveAppListSys}
                      setActiveNamingConventionSys={setActiveNamingConventionSys}
                      setActiveLessonsLearnedSys={setActiveLessonsLearnedSys}
                    />
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* --- Check Sheet Modal --- */}
        {activeCheckSheetSys && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#020617]/98 backdrop-blur-3xl" onClick={() => setActiveCheckSheetSys(null)} />
            <div className="relative w-full max-w-5xl h-[85vh] bg-[#0a0f1d] border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden animate-fadeIn flex flex-col">
               
               <header className="p-10 border-b border-slate-800/60 flex items-center justify-between shrink-0 bg-slate-950/20">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl border border-emerald-500/20">
                        <FileText size={32} />
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold tracking-tight uppercase text-white mb-1">Check Sheet</h2>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">System Architecture Verification: <span className="text-indigo-400">{activeCheckSheetSys.name}</span></p>
                     </div>
                  </div>
                  <button onClick={() => setActiveCheckSheetSys(null)} className="p-4 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"><X size={32} /></button>
               </header>

               <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#0a0f1d] overflow-hidden">
                   {/* Configuration Section */}
                   <CheckSheetSection 
                      title="Base Configuration Steps"
                      icon={Settings}
                      items={activeCheckSheetSys.checkSheetData?.configuration || DEFAULT_CHECKSHEET.configuration}
                      section="configuration"
                      systemId={activeCheckSheetSys.id}
                      isAdmin={isAdmin}
                      onToggle={(itemId) => toggleCheckSheetItem(activeCheckSheetSys.id, 'configuration', itemId)}
                      onRemove={(itemId) => removeCheckSheetItem(activeCheckSheetSys.id, 'configuration', itemId)}
                      onReorder={(oldIndex, newIndex) => reorderCheckSheetItems(activeCheckSheetSys.id, 'configuration', oldIndex, newIndex)}
                      onAdd={(label) => addCheckSheetItem(activeCheckSheetSys.id, 'configuration', label)}
                      colorClass="emerald"
                   />

                   {/* Ready for Deployment Section */}
                   <CheckSheetSection 
                      title="Ready for deployment Steps"
                      icon={ClipboardCheck}
                      items={activeCheckSheetSys.checkSheetData?.readyForDeployment || DEFAULT_CHECKSHEET.readyForDeployment}
                      section="readyForDeployment"
                      systemId={activeCheckSheetSys.id}
                      isAdmin={isAdmin}
                      onToggle={(itemId) => toggleCheckSheetItem(activeCheckSheetSys.id, 'readyForDeployment', itemId)}
                      onRemove={(itemId) => removeCheckSheetItem(activeCheckSheetSys.id, 'readyForDeployment', itemId)}
                      onReorder={(oldIndex, newIndex) => reorderCheckSheetItems(activeCheckSheetSys.id, 'readyForDeployment', oldIndex, newIndex)}
                      onAdd={(label) => addCheckSheetItem(activeCheckSheetSys.id, 'readyForDeployment', label)}
                      colorClass="blue"
                   />

                   {/* Deployment Section */}
                   <CheckSheetSection 
                      title="Deployment"
                      icon={Zap}
                      items={activeCheckSheetSys.checkSheetData?.deployment || DEFAULT_CHECKSHEET.deployment}
                      section="deployment"
                      systemId={activeCheckSheetSys.id}
                      isAdmin={isAdmin}
                      onToggle={(itemId) => toggleCheckSheetItem(activeCheckSheetSys.id, 'deployment', itemId)}
                      onRemove={(itemId) => removeCheckSheetItem(activeCheckSheetSys.id, 'deployment', itemId)}
                      onReorder={(oldIndex, newIndex) => reorderCheckSheetItems(activeCheckSheetSys.id, 'deployment', oldIndex, newIndex)}
                      onAdd={(label) => addCheckSheetItem(activeCheckSheetSys.id, 'deployment', label)}
                      colorClass="amber"
                   />
                </div>

               <footer className="p-10 border-t border-slate-800/60 flex items-center justify-between bg-slate-950/20 shrink-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Modified: {new Date().toLocaleDateString()} Hub Sync active</p>
                  <div className="flex items-center gap-4">
                     <button onClick={() => setActiveCheckSheetSys(null)} className="px-10 py-5 text-slate-400 hover:text-white font-black uppercase text-[12px] tracking-widest transition-all">Cancel</button>
                     {isAdmin && (
                       <button 
                          onClick={() => saveSystem(activeCheckSheetSys)} 
                          className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                       >
                          <Save size={18} /> Finalize Hub Record
                       </button>
                     )}
                  </div>
               </footer>

            </div>
          </div>
        )}

        {/* --- List of Applications Modal --- */}
        {activeAppListSys && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#020617]/98 backdrop-blur-3xl" onClick={() => setActiveAppListSys(null)} />
            <div className="relative w-full max-w-5xl h-[85vh] bg-[#0a0f1d] border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden animate-fadeIn flex flex-col">
               
               <header className="p-10 border-b border-slate-800/60 flex items-center justify-between shrink-0 bg-slate-950/20">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shadow-xl border border-blue-500/20">
                        <AppWindow size={32} />
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold tracking-tight uppercase text-white mb-1">List of Applications</h2>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Software Inventory: <span className="text-indigo-400">{activeAppListSys.name}</span></p>
                     </div>
                  </div>
                  <button onClick={() => setActiveAppListSys(null)} className="p-4 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"><X size={32} /></button>
               </header>

               <div className="flex-1 p-10 flex flex-col gap-8 bg-[#0a0f1d] overflow-hidden">
                  <div className="flex-1 flex flex-col bg-slate-950/40 rounded-[2rem] border border-slate-800/40 p-1 overflow-hidden shadow-inner">
                     <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800/60 bg-slate-900/30">
                        <Terminal size={16} className="text-blue-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Application Registry</span>
                        <div className="ml-auto flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                           <span className="text-[9px] font-black text-blue-500/70 uppercase tracking-widest">Active Hub Tracking</span>
                        </div>
                     </div>
                     <textarea 
                        readOnly={!isAdmin}
                        className={`flex-1 w-full bg-transparent p-10 outline-none font-mono text-base text-slate-200 leading-relaxed resize-none scroll-smooth placeholder:text-slate-700 ${!isAdmin ? 'cursor-default' : ''}`} 
                        placeholder={`Software Stack Inventory:\n\n1. [Application Name] - [Version]\n2. [Service Agent] - [Status]\n3. [Security Suite] - [Policy Build]\n4. [Custom Integration] - [Build ID]`}
                        value={activeAppListSys.appList || ''} 
                        onChange={e => isAdmin && setActiveAppListSys({...activeAppListSys, appList: e.target.value})} 
                     />
                  </div>
               </div>

               <footer className="p-10 border-t border-slate-800/60 flex items-center justify-between bg-slate-950/20 shrink-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Synced: {new Date().toLocaleDateString()}</p>
                  <div className="flex items-center gap-4">
                     <button onClick={() => setActiveAppListSys(null)} className="px-10 py-5 text-slate-400 hover:text-white font-black uppercase text-[12px] tracking-widest transition-all">{isAdmin ? 'Discard' : 'Close'}</button>
                     {isAdmin && (
                        <button 
                           onClick={() => saveSystem(activeAppListSys)} 
                           className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                        >
                           <Save size={18} /> Update Software List
                        </button>
                     )}
                  </div>
               </footer>

            </div>
          </div>
        )}

        {/* --- Naming Convention Modal --- */}
        {activeNamingConventionSys && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#020617]/98 backdrop-blur-3xl" onClick={() => setActiveNamingConventionSys(null)} />
            <div className="relative w-full max-w-5xl h-[85vh] bg-[#0a0f1d] border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden animate-fadeIn flex flex-col">
               
               <header className="p-10 border-b border-slate-800/60 flex items-center justify-between shrink-0 bg-slate-950/20">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-400 shadow-xl border border-violet-500/20">
                        <Tag size={32} />
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold tracking-tight uppercase text-white mb-1">Naming Convention</h2>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Standardized Asset ID Architecture: <span className="text-indigo-400">{activeNamingConventionSys.name}</span></p>
                     </div>
                  </div>
                  <button onClick={() => setActiveNamingConventionSys(null)} className="p-4 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"><X size={32} /></button>
               </header>

               <div className="flex-1 p-10 flex flex-col gap-8 bg-[#0a0f1d] overflow-hidden">
                  <div className="flex-1 flex flex-col bg-slate-950/40 rounded-[2rem] border border-slate-800/40 p-1 overflow-hidden shadow-inner">
                     <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800/60 bg-slate-900/30">
                        <Hash size={16} className="text-violet-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Workspace</span>
                        <div className="ml-auto flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                           <span className="text-[9px] font-black text-violet-500/70 uppercase tracking-widest">Hub Standard Active</span>
                        </div>
                     </div>
                     <textarea 
                        readOnly={!isAdmin}
                        className={`flex-1 w-full bg-transparent p-10 outline-none font-mono text-base text-slate-200 leading-relaxed resize-none scroll-smooth placeholder:text-slate-700 ${!isAdmin ? 'cursor-default' : ''}`} 
                        placeholder={`Naming Convention Framework:\n\nFormat: [PREFIX]-[SITE]-[FUNCTION]-[SEQUENCE]\n\nExample Rules:\n- Prefix: 'NBDT' for NBDT\n- Site: 'LON', 'NYC', 'SGP'\n- Function: 'SRV', 'WS', 'POS'\n- Sequence: 001-999`}
                        value={activeNamingConventionSys.namingConvention || ''} 
                        onChange={e => isAdmin && setActiveNamingConventionSys({...activeNamingConventionSys, namingConvention: e.target.value})} 
                     />
                  </div>
               </div>

               <footer className="p-10 border-t border-slate-800/60 flex items-center justify-between bg-slate-950/20 shrink-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Policy Sync Enabled</p>
                  <div className="flex items-center gap-4">
                     <button onClick={() => setActiveNamingConventionSys(null)} className="px-10 py-5 text-slate-400 hover:text-white font-black uppercase text-[12px] tracking-widest transition-all">{isAdmin ? 'Cancel' : 'Close'}</button>
                     {isAdmin && (
                        <button 
                           onClick={() => saveSystem(activeNamingConventionSys)} 
                           className="px-12 py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                        >
                           <Save size={18} /> Update Convention Standard
                        </button>
                     )}
                  </div>
               </footer>

            </div>
          </div>
        )}

        {/* --- Lessons Learned Modal --- */}
        {activeLessonsLearnedSys && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#020617]/98 backdrop-blur-3xl" onClick={() => setActiveLessonsLearnedSys(null)} />
            <div className="relative w-full max-w-5xl h-[85vh] bg-[#0a0f1d] border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden animate-fadeIn flex flex-col">
               
               <header className="p-10 border-b border-slate-800/60 flex items-center justify-between shrink-0 bg-slate-950/20">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 shadow-xl border border-amber-500/20">
                        <FileText size={32} />
                     </div>
                     <div>
                        <h2 className="text-2xl font-bold tracking-tight uppercase text-white mb-1">Lessons Learned</h2>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Knowledge Base & Post-Mortem: <span className="text-amber-400">{activeLessonsLearnedSys.name}</span></p>
                     </div>
                  </div>
                  <button onClick={() => setActiveLessonsLearnedSys(null)} className="p-4 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"><X size={32} /></button>
               </header>

               <div className="flex-1 p-10 flex flex-col gap-8 bg-[#0a0f1d] overflow-hidden">
                  <div className="flex-1 flex flex-col bg-slate-950/40 rounded-[2rem] border border-slate-800/40 p-1 overflow-hidden shadow-inner">
                     <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800/60 bg-slate-900/30">
                        <Sparkles size={16} className="text-amber-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience Repository</span>
                        <div className="ml-auto flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                           <span className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest">Continuous Improvement</span>
                        </div>
                     </div>
                     <textarea 
                        readOnly={!isAdmin}
                        className={`flex-1 w-full bg-transparent p-10 outline-none font-mono text-base text-slate-200 leading-relaxed resize-none scroll-smooth placeholder:text-slate-700 ${!isAdmin ? 'cursor-default' : ''}`} 
                        placeholder={`Lessons Learned Documentation:\n\n1. Issue Encountered:\n2. Root Cause Analysis:\n3. Resolution Implemented:\n4. Prevention Strategy:\n5. Key Takeaways:`}
                        value={activeLessonsLearnedSys.lessonsLearned || ''} 
                        onChange={e => isAdmin && setActiveLessonsLearnedSys({...activeLessonsLearnedSys, lessonsLearned: e.target.value})} 
                     />
                  </div>
               </div>

               <footer className="p-10 border-t border-slate-800/60 flex items-center justify-between bg-slate-950/20 shrink-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Knowledge Shared with Team</p>
                  <div className="flex items-center gap-4">
                     <button onClick={() => setActiveLessonsLearnedSys(null)} className="px-10 py-5 text-slate-400 hover:text-white font-black uppercase text-[12px] tracking-widest transition-all">{isAdmin ? 'Discard' : 'Close'}</button>
                     {isAdmin && (
                        <button 
                           onClick={() => saveSystem(activeLessonsLearnedSys)} 
                           className="px-12 py-5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                        >
                           <Save size={18} /> Archive Lesson
                        </button>
                     )}
                  </div>
               </footer>

            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="p-16 flex flex-col h-full overflow-hidden animate-fadeIn w-full">
            <h1 className="text-5 font-black tracking-tighter mb-4 text-white">Collab Hub</h1>
            <p className="text-slate-400 mb-12 text-lg">Firebase Realtime Sync is active. All documentation and roadmap changes are broadcasted globally.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 overflow-y-auto pr-4 no-scrollbar">
               <div className="bg-[#0a0f1d] border border-slate-800 p-12 rounded-[3rem] flex flex-col gap-8 relative overflow-hidden shadow-2xl">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center shadow-lg"><Cloud className="text-indigo-500" size={24}/></div>
                     <h2 className="text-2xl font-black uppercase tracking-tight text-white">Master Sync</h2>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
                        <span className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-widest opacity-60">Project ID</span>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-indigo-400 font-mono tracking-tighter truncate pr-4">{project.id}</span>
                          <div className="flex gap-2">
                            <button onClick={() => copyToClipboard(project.id)} className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:text-indigo-400 transition-all active:scale-90"><Copy size={16}/></button>
                          </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => broadcastState(project)} className="flex-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600/20 transition-all active:scale-95 shadow-lg">
                          <Upload size={14}/> Force Hub Push
                        </button>
                    </div>
                  </div>
               </div>

               <div className="bg-[#0a0f1d] border border-slate-800 p-12 rounded-[3rem] flex flex-col gap-8 shadow-2xl">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shadow-lg"><History className="text-emerald-500" size={24}/></div>
                     <h2 className="text-2xl font-black uppercase tracking-tight text-white">Health</h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="p-6 bg-slate-950/30 border border-slate-800/50 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Connectivity</p>
                      <div className="flex items-center gap-3">
                         <div className={`w-3 h-3 rounded-full bg-emerald-500 animate-pulse`}></div>
                         <p className="text-lg font-black uppercase tracking-tight text-slate-200">Hub Online</p>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-950/30 border border-slate-800/50 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Last Update Received</p>
                      <p className="text-sm font-mono text-indigo-400/80">{new Date(project.updatedAt).toLocaleTimeString()} • Hub Broadcast</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="px-10 py-6 flex flex-col h-full overflow-hidden animate-fadeIn w-full bg-[#020617] relative">
            {/* Atmospheric Depth */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] pulse-bg" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] pulse-bg" style={{ animationDelay: '-4s' }} />
              {project.issues.some(i => i.severity === 'Critical') && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-red-500/[0.02] blur-[150px] pulse-bg" />
              )}
            </div>

            <header className="flex items-center justify-between mb-8 shrink-0 relative z-10">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      <ShieldAlert className="text-red-500" size={18} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Issue Tracker</h1>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-slate-400 text-sm font-medium">System anomalies and maintenance tracking hub.</p>
                    <div className="flex items-center gap-1 h-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-1 bg-indigo-500/30 rounded-full pulse-line" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search issues..." 
                      className="bg-[#0a0f1d] border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-xs outline-none focus:border-indigo-500 w-[240px] transition-all text-white placeholder:text-slate-600" 
                      value={issueSearch} 
                      onChange={e => setIssueSearch(e.target.value)} 
                    />
                  </div>

                  {/* Admin Toggle (Local for Issues) - Refined */}
                  <button 
                    onClick={() => {
                      if (isAdmin) {
                        setIsAdmin(false);
                      } else {
                        setShowAdminAuthModal(true);
                        setAdminPassInput('');
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-500 cursor-pointer group ${
                      isAdmin 
                        ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                        : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700 backdrop-blur-md'
                    }`}
                  >
                    <div className={`w-7 h-3.5 rounded-full relative transition-all duration-500 ${isAdmin ? 'bg-indigo-500/40' : 'bg-slate-800'}`}>
                      <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all duration-500 shadow-sm ${isAdmin ? 'left-4 bg-indigo-400' : 'left-0.5 bg-slate-600'}`} />
                    </div>
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase">
                      {isAdmin ? 'Admin' : 'View Only'}
                    </span>
                  </button>

                  {isAdmin && (
                    <button 
                      onClick={() => setDraftIssue({
                        id: `issue-${Date.now()}`,
                        systemId: project.systems[0]?.id || '',
                        title: '',
                        description: '',
                        severity: 'Medium',
                        status: 'Open',
                        assigneeId: project.members[0]?.id || '',
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                      })} 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Plus size={16}/> Create
                    </button>
                  )}
               </div>
            </header>

            {/* Quick Filters - Refined Hierarchy */}
            <div className="mb-8 flex items-center gap-8 shrink-0 relative z-10">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Severity:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'Critical', color: 'red' },
                    { label: 'High', color: 'orange' },
                    { label: 'Medium', color: 'amber' },
                    { label: 'Low', color: 'blue' }
                  ].map(sev => (
                    <button 
                      key={sev.label}
                      onClick={() => setIssueSeverityFilter(issueSeverityFilter === sev.label ? '' : sev.label)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-[9px] font-black transition-all duration-300 uppercase tracking-tighter",
                        issueSeverityFilter === sev.label
                        ? `bg-${sev.color}-500/20 border-${sev.color}-500/50 text-${sev.color}-400 shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                        : "bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                      )}
                    >
                      {sev.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-4 w-px bg-slate-800" />
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Assignee:</span>
                <select 
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-300 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">All Assignees</option>
                  {project.members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              {(issueSeverityFilter || assigneeFilter || issueSearch) && (
                <>
                  <div className="h-4 w-px bg-slate-800" />
                  <button 
                    onClick={() => {
                      setIssueSeverityFilter('');
                      setAssigneeFilter('');
                      setIssueSearch('');
                    }}
                    className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                  >
                    Clear All
                  </button>
                </>
              )}
            </div>

            {/* Kanban Board */}
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleIssueDragStart}
              onDragEnd={handleIssueDragEnd}
            >
              <div className="flex-1 flex gap-6 overflow-x-auto pb-6 no-scrollbar relative z-10">
                {['Open', 'Investigating', 'Waiting for Parts', 'Resolved'].map(status => {
                  const columnIssues = filteredIssues.filter(i => i.status === status);
                  
                  return (
                    <KanbanColumn 
                      key={status} 
                      status={status as IssueStatus} 
                      issues={columnIssues} 
                      project={project}
                      setDraftIssue={setDraftIssue}
                    />
                  );
                })}
              </div>

              <DragOverlay adjustScale={false} dropAnimation={null}>
                {activeIssueId ? (
                  <motion.div 
                    initial={{ scale: 1, rotate: 0 }}
                    animate={{ scale: 1.05, rotate: 1.5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="w-[308px] cursor-grabbing pointer-events-none"
                  >
                    <StaticIssueCard 
                      issue={project.issues.find(i => i.id === activeIssueId)!} 
                      project={project} 
                      isOverlay={true}
                    />
                  </motion.div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {activeTab === 'config-report' && (
          <div className="flex-1 flex flex-col overflow-hidden animate-fadeIn">
            <header className="px-10 py-6 flex items-center justify-between shrink-0 border-b border-slate-900/50 bg-[#020617]">
              <div>
                <h1 className="text-3xl font-bold tracking-tighter text-white">Configuration Report</h1>
                <p className="text-slate-500 text-sm font-medium">Real-time Deployment Analytics</p>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={importConfigReport} 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv"
                />
                <button 
                  onClick={exportConfigReport}
                  className="flex items-center gap-3 px-6 py-3 bg-slate-900/40 border border-slate-800 text-slate-400 rounded-2xl transition-all hover:bg-slate-800 hover:text-white uppercase tracking-widest text-[11px] font-black"
                >
                  <Download size={16} /> Export Data
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-widest text-[11px] font-black"
                >
                  <Upload size={16} /> Import Report
                </button>

                {/* Admin Toggle (Local for Config Report) */}
                <button 
                  onClick={() => {
                    if (isAdmin) {
                      setIsAdmin(false);
                    } else {
                      setShowAdminAuthModal(true);
                      setAdminPassInput('');
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                    isAdmin 
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 backdrop-blur-md'
                  }`}
                >
                  {isAdmin ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    {isAdmin ? 'Admin Mode' : 'View Mode'}
                  </span>
                  <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${isAdmin ? 'bg-indigo-400' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all duration-300 ${isAdmin ? 'left-5' : 'left-1'}`} />
                  </div>
                </button>
              </div>
            </header>
            <ConfigurationReport 
              isAdmin={isAdmin} 
              members={project.members} 
              projectId={project.id} 
              projectName={project.name}
              rows={project.configReportRows || INITIAL_CONFIG_REPORT_ROWS}
              onRowsChange={(newRows) => handleAction(prev => ({ ...prev, configReportRows: newRows }))}
            />
          </div>
        )}

        {draftIssue && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" onClick={() => setDraftIssue(null)} />
            <div className="relative w-full max-w-2xl bg-[#080d1a] border border-slate-800 rounded-[3rem] shadow-2xl p-10 animate-fadeIn flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar">
               <h2 className="text-3xl font-black uppercase tracking-tight mb-10 text-white">Report System Issue</h2>
               
               <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Issue Title</label>
                    <input 
                      className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-red-500 transition-all outline-none uppercase text-white shadow-inner" 
                      placeholder="e.g. Network Latency Spike" 
                      value={draftIssue.title} 
                      onChange={e => setDraftIssue({...draftIssue, title: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Affected System</label>
                    <select 
                      className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-red-500 transition-all outline-none uppercase text-white cursor-pointer shadow-inner" 
                      value={draftIssue.systemId} 
                      onChange={e => setDraftIssue({...draftIssue, systemId: e.target.value})}
                    >
                      {project.systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Severity</label>
                      <select 
                        className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-red-500 transition-all outline-none uppercase text-white cursor-pointer shadow-inner" 
                        value={draftIssue.severity} 
                        onChange={e => setDraftIssue({...draftIssue, severity: e.target.value as IssueSeverity})}
                      >
                        {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Status</label>
                      <select 
                        className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-red-500 transition-all outline-none uppercase text-white cursor-pointer shadow-inner" 
                        value={draftIssue.status} 
                        onChange={e => setDraftIssue({...draftIssue, status: e.target.value as IssueStatus})}
                      >
                        {['Open', 'Investigating', 'Waiting for Parts', 'Resolved'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Assignee</label>
                    <select 
                      className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-red-500 transition-all outline-none uppercase text-white cursor-pointer shadow-inner" 
                      value={draftIssue.assigneeId || ''} 
                      onChange={e => setDraftIssue({...draftIssue, assigneeId: e.target.value})}
                    >
                      <option value="">Unassigned</option>
                      {project.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Detailed Description</label>
                    <textarea 
                      className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-6 min-h-[140px] outline-none font-mono text-xs text-slate-300 focus:border-red-500 transition-all shadow-inner leading-relaxed" 
                      placeholder="Describe the anomaly, steps to reproduce, and any troubleshooting performed..." 
                      value={draftIssue.description} 
                      onChange={e => setDraftIssue({...draftIssue, description: e.target.value})} 
                    />
                  </div>

                  <div className="pt-6 flex gap-4">
                    {isAdmin ? (
                      <>
                        <button 
                          onClick={() => {
                            const now = Date.now();
                            saveIssue({
                              ...draftIssue,
                              updatedAt: now,
                              createdAt: draftIssue.createdAt || now
                            });
                          }} 
                          className="flex-1 py-6 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-2xl shadow-red-500/10 flex items-center justify-center gap-3"
                        >
                          <Save size={18} /> Commit Issue Record
                        </button>
                        <button 
                          onClick={() => {
                            handleAction(prev => ({ ...prev, issues: prev.issues.filter(i => i.id !== draftIssue.id) }));
                            setDraftIssue(null);
                          }} 
                          className="px-8 bg-slate-900 text-red-500 border border-slate-800 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95"
                        >
                          <Trash2 size={24}/>
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setDraftIssue(null)} className="w-full py-6 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Close Viewer</button>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- Dialogs & Modals --- */}
        {draftTask && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" onClick={() => setDraftTask(null)} />
            <div className="relative w-full max-w-2xl bg-[#0a0f1d] border border-slate-800 rounded-[2.5rem] shadow-2xl p-10 animate-fadeIn flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-white">Edit Hub Record</h2>
                  <button onClick={() => setDraftTask(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all"><X size={24} /></button>
               </div>
               
               <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest">Label</label>
                    <textarea 
                      autoFocus 
                      className="w-full bg-[#020617] border border-indigo-500/30 rounded-2xl p-6 text-lg font-bold outline-none text-white placeholder:text-slate-700 min-h-[120px] resize-y leading-tight focus:border-indigo-500 transition-all" 
                      placeholder="Task name..."
                      value={draftTask.label} 
                      onChange={e => setDraftTask({...draftTask, label: e.target.value})} 
                    />
                  </div>

                  {/* Checklist Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Checklist</label>
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            const newItem: ChecklistItem = { id: Date.now().toString(), label: '', completed: false };
                            setDraftTask({ ...draftTask, checklist: [...(draftTask.checklist || []), newItem] });
                          }}
                          className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                        >
                          <Plus size={12} /> Add Item
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {(draftTask.checklist || []).map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-3 group/item">
                          <button 
                            onClick={() => {
                              const newList = [...(draftTask.checklist || [])];
                              newList[idx] = { ...item, completed: !item.completed };
                              setDraftTask({ ...draftTask, checklist: newList });
                            }}
                            className={`shrink-0 transition-colors ${item.completed ? 'text-emerald-500' : 'text-slate-600 hover:text-slate-400'}`}
                          >
                            {item.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                          <input 
                            className={`flex-1 bg-transparent border-b border-transparent focus:border-indigo-500/30 outline-none text-[12px] font-medium transition-all ${item.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}
                            placeholder="Checklist item..."
                            value={item.label}
                            onChange={e => {
                              const newList = [...(draftTask.checklist || [])];
                              newList[idx] = { ...item, label: e.target.value };
                              setDraftTask({ ...draftTask, checklist: newList });
                            }}
                          />
                          {isAdmin && (
                            <button 
                              onClick={() => {
                                const newList = (draftTask.checklist || []).filter(i => i.id !== item.id);
                                setDraftTask({ ...draftTask, checklist: newList });
                              }}
                              className="opacity-0 group-hover/item:opacity-100 p-1.5 text-slate-600 hover:text-red-400 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      {(!draftTask.checklist || draftTask.checklist.length === 0) && (
                        <p className="text-[10px] text-slate-600 italic">No checklist items added yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="relative">
                      <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest">Date</label>
                      <div className="relative group/date">
                        <Calendar size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/date:text-blue-400 pointer-events-none" />
                        <input 
                          type="date" 
                          className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 text-[12px] font-bold text-blue-400 outline-none cursor-pointer hover:border-slate-700 transition-colors" 
                          value={getDateInputValue(project.startDate, draftTask)} 
                          onChange={e => {
                            const newDate = e.target.value;
                            setDraftTask({
                              ...draftTask, 
                              date: newDate, 
                              startWeek: getWeekFromDate(project.startDate, newDate)
                            });
                          }} 
                        />
                      </div>
                      {draftTask.isMilestone && (
                        <div className="mt-2 text-[9px] font-black text-amber-500 uppercase tracking-widest opacity-60">Specific Day Selected</div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest">Status</label>
                      <select className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 outline-none font-bold text-indigo-400 text-[12px] cursor-pointer hover:border-slate-700 transition-colors" value={draftTask.status} onChange={e => setDraftTask({...draftTask, status: e.target.value as TaskStatus})}>
                        {['Planned', 'In Progress', 'Completed', 'Blocked'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="pt-8 space-y-4">
                    {isAdmin ? (
                       <button onClick={() => saveTask(draftTask)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                         <Save size={18} /> Save Changes
                       </button>
                     ) : (
                       <button onClick={() => setDraftTask(null)} className="w-full py-5 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[12px] tracking-widest transition-all">Close Viewer</button>
                     )}
                    {isAdmin && (
                      <div className="w-full">
                        {deleteConfirmTaskId === draftTask.id ? (
                          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest text-center">Are you absolutely sure?</p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => { 
                                  handleAction(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== draftTask.id) })); 
                                  setDraftTask(null); 
                                  setDeleteConfirmTaskId(null);
                                }} 
                                className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 transition-all"
                              >
                                Yes, Delete
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmTaskId(null)} 
                                className="flex-1 py-4 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirmTaskId(draftTask.id)} 
                            className="w-full py-4 text-red-500/60 hover:text-red-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                          >
                            Delete Permanently
                          </button>
                        )}
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {draftSystem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" onClick={() => setDraftSystem(null)} />
            <div className="relative w-full max-w-3xl bg-[#080d1a] border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden animate-fadeIn p-10 max-h-[95vh] overflow-y-auto no-scrollbar">
               <div className="flex items-center justify-between mb-10 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shadow-inner">
                        {getDeviceIcon(draftSystem.deviceCategory, 24)}
                    </div>
                    <h2 className="text-3xl font-black tracking-tight uppercase text-white">System Engineering</h2>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Assignee</span>
                     <select className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-2.5 text-[10px] font-black text-indigo-400 outline-none uppercase cursor-pointer shadow-lg" value={draftSystem.assigneeId || ''} onChange={e => setDraftSystem({...draftSystem, assigneeId: e.target.value})}>
                        <option value="">UNASSIGNED</option>
                        {project.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                       <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">System Identity</label>
                       <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-indigo-500 transition-all outline-none uppercase text-white shadow-inner" placeholder="e.g. Primary POS Terminal" value={draftSystem.name} onChange={e => setDraftSystem({...draftSystem, name: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Device Category</label>
                          <select className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-indigo-500 transition-all outline-none uppercase text-white cursor-pointer shadow-inner" value={draftSystem.deviceCategory} onChange={e => setDraftSystem({...draftSystem, deviceCategory: e.target.value as DeviceCategory})}>
                             {['PC', 'Laptop', 'Tablet', 'Phone', 'Kiosk'].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Hardware ID / Model</label>
                          <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-indigo-500 transition-all outline-none text-white shadow-inner" placeholder="e.g. Nino III J2" value={draftSystem.deviceType} onChange={e => setDraftSystem({...draftSystem, deviceType: e.target.value})} />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">OS Family</label>
                          <select className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-indigo-500 transition-all outline-none uppercase text-white cursor-pointer shadow-inner" value={draftSystem.os} onChange={e => setDraftSystem({...draftSystem, os: e.target.value as OSType})}>
                             {['Windows', 'Linux', 'iOS', 'Android', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">OS Version / Build</label>
                          <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-indigo-500 transition-all outline-none text-white shadow-inner" placeholder="e.g. 21H2 LTSC" value={draftSystem.osVersion} onChange={e => setDraftSystem({...draftSystem, osVersion: e.target.value})} />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Network Type</label>
                          <select className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-indigo-500 transition-all outline-none uppercase text-white cursor-pointer shadow-inner" value={draftSystem.network} onChange={e => setDraftSystem({...draftSystem, network: e.target.value})}>
                             {['Wired', 'WiFi', 'Offline'].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Segment / VLAN</label>
                          <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-black focus:border-indigo-500 transition-all outline-none text-white font-mono shadow-inner" placeholder="e.g. 500" value={draftSystem.vlan} onChange={e => setDraftSystem({...draftSystem, vlan: e.target.value})} />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                       <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Service Credentials</label>
                       <div className="relative group/field">
                          <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-indigo-400 transition-colors" />
                          <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl py-5 pl-14 pr-5 font-bold focus:border-indigo-500 transition-all outline-none text-white shadow-inner" placeholder="e.g. POS_SRV_HUB" value={draftSystem.serviceAccount} onChange={e => setDraftSystem({...draftSystem, serviceAccount: e.target.value})} />
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">User Account</label>
                       <div className="relative group/field">
                          <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-indigo-400 transition-colors" />
                          <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl py-5 pl-14 pr-5 font-bold focus:border-indigo-500 transition-all outline-none text-white shadow-inner" placeholder="e.g. AD\POSUSER (268)" value={draftSystem.userAccount} onChange={e => setDraftSystem({...draftSystem, userAccount: e.target.value})} />
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Authentication Type</label>
                       <div className="relative group/field">
                          <LogIn size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/field:text-indigo-400 transition-colors" />
                          <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl py-5 pl-14 pr-5 font-bold focus:border-indigo-500 transition-all outline-none uppercase text-white shadow-inner" placeholder="e.g. Autologon (Encrypted)" value={draftSystem.logonType} onChange={e => setDraftSystem({...draftSystem, logonType: e.target.value})} />
                       </div>
                    </div>
                    {/* Edit fields for new properties */}
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">IP Scope</label>
                          <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-bold outline-none text-white shadow-inner" value={draftSystem.ipScope} onChange={e => setDraftSystem({...draftSystem, ipScope: e.target.value})} />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">IP Reservation</label>
                          <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-bold outline-none text-white shadow-inner" value={draftSystem.ipReservation} onChange={e => setDraftSystem({...draftSystem, ipReservation: e.target.value})} />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Domain OU</label>
                          <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-bold outline-none text-white shadow-inner" value={draftSystem.domainOU} onChange={e => setDraftSystem({...draftSystem, domainOU: e.target.value})} />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">AirWatch Tags</label>
                          <input className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 font-bold outline-none text-white shadow-inner" value={draftSystem.airWatchTags} onChange={e => setDraftSystem({...draftSystem, airWatchTags: e.target.value})} />
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-slate-500 block mb-3 uppercase tracking-widest opacity-60">Engineering Notes</label>
                       <textarea className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-6 min-h-[140px] outline-none font-mono text-xs text-slate-300 focus:border-indigo-500 transition-all shadow-inner leading-relaxed" placeholder="Document specific configuration, dependencies, or maintenance history here..." value={draftSystem.documentation || ''} onChange={e => setDraftSystem({...draftSystem, documentation: e.target.value})} />
                    </div>
                  </div>
               </div>

               <div className="pt-10 border-t border-slate-800/60 mt-4 flex gap-4 shrink-0">
                  {isAdmin ? (
                    <button onClick={() => saveSystem(draftSystem)} className="flex-1 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-2xl shadow-indigo-500/10 flex items-center justify-center gap-3">
                      <Save size={18} /> Save Hub Passport
                    </button>
                  ) : (
                    <button onClick={() => setDraftSystem(null)} className="w-full py-6 bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Close Viewer</button>
                  )}
                  {isAdmin && <button onClick={() => { handleAction(p => ({ ...p, systems: p.systems.filter(s => s.id !== draftSystem.id) })); setDraftSystem(null); }} className="px-8 bg-red-500/10 text-red-500 border border-red-500/10 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95"><Trash2 size={24}/></button>}
               </div>
            </div>
          </div>
        )}
        {showAdminAuthModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" onClick={() => setShowAdminAuthModal(false)} />
            <div className="relative w-full max-w-sm bg-[#080d1a] border border-slate-800 rounded-[2.5rem] shadow-2xl p-10 animate-fadeIn text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-6 shadow-inner">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-white">Admin Access</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Enter Authorization Key</p>
              
              <input 
                type="password"
                autoFocus
                className="w-full bg-[#020617] border border-slate-800 rounded-2xl p-5 text-center text-xl font-black tracking-[0.5em] focus:border-indigo-500 transition-all outline-none text-white shadow-inner mb-6"
                placeholder="••••••"
                value={adminPassInput}
                onChange={e => setAdminPassInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (adminPassInput === ADMIN_PASSWORD) {
                      setIsAdmin(true);
                      setShowAdminAuthModal(false);
                    } else {
                      alert('Access Denied: Incorrect Key');
                      setAdminPassInput('');
                    }
                  }
                  if (e.key === 'Escape') setShowAdminAuthModal(false);
                }}
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAdminAuthModal(false)}
                  className="flex-1 py-4 bg-slate-900 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (adminPassInput === ADMIN_PASSWORD) {
                      setIsAdmin(true);
                      setShowAdminAuthModal(false);
                    } else {
                      alert('Access Denied: Incorrect Key');
                      setAdminPassInput('');
                    }
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Task Popover */}
        <AnimatePresence>
          {selectedMemberId && (
            <ProjectPanel 
              member={project.members.find(m => m.id === selectedMemberId)!}
              projects={userProjects[selectedMemberId] || []}
              onClose={() => setSelectedMemberId(null)}
              isAdmin={isAdmin}
              onProjectsChange={handleUserProjectsChange}
            />
          )}

          {hoveredTaskInfo && !draggingTaskId && (
            <motion.div 
              initial={{ opacity: 0, x: -10, y: "-50%", scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: "-50%", scale: 1 }}
              exit={{ opacity: 0, x: -10, y: "-50%", scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[9999] pointer-events-none"
              style={{ 
                left: hoveredTaskInfo.rect.right + 16, 
                top: hoveredTaskInfo.rect.top + hoveredTaskInfo.rect.height / 2
              }}
            >
              {/* Premium "Energy Bridge" Connector */}
              <div className="absolute right-[calc(100%-12px)] top-1/2 -translate-y-1/2 w-8 h-10 z-[-1] flex items-center justify-end overflow-visible">
                {/* The Magnetic Tip (Point of contact) */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <motion.div 
                    className={`w-1.5 h-1.5 rounded-full ${hoveredTaskInfo.config.accent} z-10`}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Ripple effect */}
                  {[1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-1.5 h-1.5 rounded-full border border-white/30`}
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 4, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.7, ease: "easeOut" }}
                    />
                  ))}
                </div>

                {/* The Geometric Bridge (Beaked Shape) */}
                <div className="relative w-6 h-6 rotate-45 bg-[#0f172a] border-l border-b border-white/10 shadow-[-5px_5px_15px_rgba(0,0,0,0.4)] overflow-hidden backdrop-blur-sm">
                  {/* Layer 1: Ambient Flow */}
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent`}
                    animate={{ x: [-40, 40], y: [-40, 40] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                  
                  {/* Layer 2: The Traveling Spark */}
                  <motion.div 
                    className="absolute w-[150%] h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent -rotate-45 origin-center"
                    style={{ top: '50%', left: '-25%' }}
                    animate={{ 
                      x: ['-100%', '100%'],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 1.2, 
                      repeat: Infinity, 
                      repeatDelay: 0.5,
                      ease: "easeInOut" 
                    }}
                  />

                  {/* Layer 3: Task Color Bleed */}
                  <div className={`absolute inset-0 opacity-20 bg-gradient-to-br from-transparent to-${hoveredTaskInfo.config.text.split('-')[1]}-500`} />
                </div>
              </div>

              <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden relative w-72">
                {/* Internal Light Leak from the connector */}
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-20 h-32 blur-[40px] opacity-20 rounded-full ${hoveredTaskInfo.config.accent}`} />
                
                {/* Decorative Glow (Top Right) */}
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 ${hoveredTaskInfo.config.accent}`} />
                
                <div className="relative flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      {hoveredTaskInfo.isMilestone && <span className="text-[7px] font-black text-indigo-400/80 uppercase tracking-widest">Milestone</span>}
                      <h4 className="text-[11px] font-bold text-white leading-tight tracking-tight">{hoveredTaskInfo.task.label}</h4>
                    </div>
                    <div className={`shrink-0 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${hoveredTaskInfo.config.border} ${hoveredTaskInfo.config.text} bg-white/5`}>
                      {hoveredTaskInfo.task.status}
                    </div>
                  </div>
                  
                  <div className="h-px w-full bg-white/5" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-500">
                         <Calendar size={10} />
                         <span className="text-[7px] font-black uppercase tracking-widest">{hoveredTaskInfo.isMilestone ? 'Scheduled' : 'Timeline'}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-300">
                        {hoveredTaskInfo.isMilestone ? (
                          <>
                            {(() => {
                              const m = hoveredTaskInfo.task;
                              const mDate = m.date ? parseLocalDate(m.date) : parseLocalDate(project.startDate);
                              if (!m.date) mDate.setDate(mDate.getDate() + (m.startWeek * 7));
                              return mDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
                            })()}
                            <span className="text-slate-500 ml-1">Week {hoveredTaskInfo.task.startWeek + 1}</span>
                          </>
                        ) : (
                          `Week ${hoveredTaskInfo.task.startWeek + 1} — ${hoveredTaskInfo.task.startWeek + hoveredTaskInfo.task.duration}`
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-500">
                         <User size={10} />
                         <span className="text-[7px] font-black uppercase tracking-widest">Assignee</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-300">{hoveredTaskInfo.memberName}</span>
                    </div>
                  </div>

                  {hoveredTaskInfo.task.checklist && hoveredTaskInfo.task.checklist.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-slate-500">
                         <ClipboardList size={10} />
                         <span className="text-[7px] font-black uppercase tracking-widest">Checklist</span>
                      </div>
                      <div className="space-y-1.5">
                        {hoveredTaskInfo.task.checklist.map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700'}`}>
                              {item.completed && <CheckCircle2 size={8} />}
                            </div>
                            <span className={`text-[9px] leading-tight ${item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {hoveredTaskInfo.task.description && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-500">
                         <Box size={10} />
                         <span className="text-[7px] font-black uppercase tracking-widest">Details</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{hoveredTaskInfo.task.description}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Magical Animated Connector Arrow */}
              <div className="absolute right-[calc(100%-10px)] top-1/2 -translate-y-1/2 w-5 h-5 bg-[#0f172a] border-l border-b border-white/20 rotate-45 z-[-1] overflow-hidden">
                {/* Converging flow animation */}
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-bl from-transparent via-white/5 to-white/20`}
                  animate={{
                    x: [15, -15],
                    y: [-15, 15],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                {/* Glowing Tip */}
                <motion.div 
                  className={`absolute bottom-0 left-0 w-3 h-3 ${hoveredTaskInfo.config.accent} blur-[3px] -translate-x-1/2 translate-y-1/2`}
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

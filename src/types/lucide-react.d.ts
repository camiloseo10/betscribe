declare module 'lucide-react' {
  import { SVGProps } from 'react';

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    className?: string;
  }

  export type LucideIcon = (props: LucideProps) => JSX.Element;

  // Common icons - you can add more as needed
  export const Search: LucideIcon;
  export const Plus: LucideIcon;
  export const X: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Menu: LucideIcon;
  export const Home: LucideIcon;
  export const Settings: LucideIcon;
  export const User: LucideIcon;
  export const LogOut: LucideIcon;
  export const Loader2: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Download: LucideIcon;
  export const Eye: LucideIcon;
  export const Trash2: LucideIcon;
  export const FileText: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Globe: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const Target: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Table: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Languages: LucideIcon;
  export const Clock: LucideIcon;
  export const Star: LucideIcon;
  export const Moon: LucideIcon;
  export const Sun: LucideIcon;
  export const ListTree: LucideIcon;
  export const Settings: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const XCircle: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Edit3: LucideIcon;
  export const Upload: LucideIcon;
  export const Brain: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Copy: LucideIcon;
  export const Zap: LucideIcon;
  export const Layers: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const CheckIcon: LucideIcon;
  export const XIcon: LucideIcon;
  export const SearchIcon: LucideIcon;
  export const ChevronDownIcon: LucideIcon;
  export const ChevronLeftIcon: LucideIcon;
  export const ChevronRightIcon: LucideIcon;
  export const ChevronUpIcon: LucideIcon;
  export const CircleIcon: LucideIcon;
  export const PanelLeftIcon: LucideIcon;
  export const GripVerticalIcon: LucideIcon;
  export const MinusIcon: LucideIcon;
  export const Loader2Icon: LucideIcon;
  export const Users: LucideIcon;
  export const Building2: LucideIcon;
  export const Heart: LucideIcon;
}

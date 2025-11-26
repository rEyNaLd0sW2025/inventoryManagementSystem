import { User as UserIcon } from 'lucide-react';
import { users } from '../data/mockData';
import { User } from '../types';

interface UserSwitcherProps {
  currentUser: User;
  onUserChange: (userId: string) => void;
}

export function UserSwitcher({ currentUser, onUserChange }: UserSwitcherProps) {
  return (
    <div className="relative">
      <select
        value={currentUser.id}
        onChange={(e) => onUserChange(e.target.value)}
        className="appearance-none flex items-center gap-2 pl-3 pr-8 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.name} - {user.role === 'super_admin' ? 'Super Admin' : user.warehouseName}
          </option>
        ))}
      </select>
      <UserIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Users, UserPlus, UserMinus, Shield, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface AccessControlPanelProps {
  onUpdatePermissions?: (permissions: any) => void;
  className?: string;
}

interface Permission {
  id: string;
  user: string;
  type: 'read' | 'write' | 'admin';
  grantedAt: number;
  expiresAt?: number;
}

export default function AccessControlPanel({ onUpdatePermissions, className }: AccessControlPanelProps) {
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: '1',
      user: 'user@example.com',
      type: 'admin',
      grantedAt: Date.now() - 86400000, // 1 day ago
    },
    {
      id: '2',
      user: 'collaborator@example.com',
      type: 'write',
      grantedAt: Date.now() - 3600000, // 1 hour ago
    },
    {
      id: '3',
      user: 'viewer@example.com',
      type: 'read',
      grantedAt: Date.now() - 1800000, // 30 minutes ago
    }
  ]);

  const [newUser, setNewUser] = useState('');
  const [newPermissionType, setNewPermissionType] = useState<'read' | 'write' | 'admin'>('read');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddPermission = () => {
    if (!newUser.trim()) return;

    const newPermission: Permission = {
      id: Date.now().toString(),
      user: newUser,
      type: newPermissionType,
      grantedAt: Date.now(),
    };

    setPermissions(prev => [...prev, newPermission]);
    setNewUser('');
    setShowAddForm(false);
    onUpdatePermissions?.(permissions);
  };

  const handleRemovePermission = (id: string) => {
    setPermissions(prev => prev.filter(p => p.id !== id));
    onUpdatePermissions?.(permissions);
  };

  const handleUpdatePermission = (id: string, type: 'read' | 'write' | 'admin') => {
    setPermissions(prev => 
      prev.map(p => p.id === id ? { ...p, type } : p)
    );
    onUpdatePermissions?.(permissions);
  };

  const getPermissionIcon = (type: 'read' | 'write' | 'admin') => {
    switch (type) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'write':
        return <Users className="w-4 h-4 text-yellow-500" />;
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getPermissionColor = (type: 'read' | 'write' | 'admin') => {
    switch (type) {
      case 'admin':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'write':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'read':
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Access Control</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Email
            </label>
            <input
              type="email"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permission Level
            </label>
            <select
              value={newPermissionType}
              onChange={(e) => setNewPermissionType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="read">Read Only</option>
              <option value="write">Read & Write</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleAddPermission}
              className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Permission
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Permissions List */}
      <div className="space-y-2">
        {permissions.map((permission) => (
          <div
            key={permission.id}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {getPermissionIcon(permission.type)}
              <div>
                <p className="text-sm font-medium text-gray-900">{permission.user}</p>
                <p className="text-xs text-gray-500">
                  Added {new Date(permission.grantedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={permission.type}
                onChange={(e) => handleUpdatePermission(permission.id, e.target.value as any)}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded border",
                  getPermissionColor(permission.type)
                )}
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="admin">Admin</option>
              </select>

              <button
                onClick={() => handleRemovePermission(permission.id)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <UserMinus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Access Summary</span>
        </div>
        <div className="text-xs text-blue-700 space-y-1">
          <div>Total Users: {permissions.length}</div>
          <div>Admins: {permissions.filter(p => p.type === 'admin').length}</div>
          <div>Writers: {permissions.filter(p => p.type === 'write').length}</div>
          <div>Readers: {permissions.filter(p => p.type === 'read').length}</div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

export default function TeamList() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role')
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create user');
      }

      await fetchUsers();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-stone-900">Team Management</h2>
          <p className="text-stone-500 mt-1">Manage staff access and roles.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20"
        >
          <Users className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/50 text-stone-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-stone-600" />
                    </div>
                    <span className="font-bold text-stone-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-stone-600">{u.email}</td>
                <td className="px-6 py-4">
                  {u.role === 'ADMIN' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800">
                      <Shield className="w-3 h-3" /> ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-stone-100 text-stone-700">
                      STAFF
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {u.id !== currentUser?.id && (
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Team Member">
        <form onSubmit={handleAddUser} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Full Name</label>
              <input required name="name" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Email Address</label>
              <input type="email" required name="email" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Temporary Password</label>
              <input type="text" required name="password" minLength={6} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Account Role</label>
              <select name="role" required className="w-full px-4 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                <option value="STAFF">Staff (Garment updates only, no financial views)</option>
                <option value="ADMIN">Admin (Full access to costs, reports, orders)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-medium">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-brand-900 text-white rounded-xl font-medium shadow-lg shadow-brand-900/20">Create Member</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

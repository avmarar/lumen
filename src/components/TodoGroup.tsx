'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Todo } from '@/lib/types';
import { TodoRow } from './TodoRow';

interface TodoGroupProps {
  title: string;
  todos: Todo[];
  badgeColor?: string;
  defaultExpanded?: boolean;
}

export function TodoGroup({
  title,
  todos,
  badgeColor = 'bg-stone-200 text-stone-700',
  defaultExpanded = true,
}: TodoGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (todos.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800 tracking-wider uppercase transition group"
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
        )}
        <span>{title}</span>
        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${badgeColor}`}>
          {todos.length}
        </span>
      </button>

      {/* Rows List */}
      {isExpanded && (
        <div className="space-y-2">
          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  );
}

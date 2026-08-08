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
  const panelId = `todo-group-${title.replace(/\s+/g, '-').toLowerCase()}`;

  if (todos.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-800 tracking-wider uppercase transition group"
      >
        {isExpanded ? (
          <ChevronDown
            className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-700"
            aria-hidden="true"
          />
        ) : (
          <ChevronRight
            className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-700"
            aria-hidden="true"
          />
        )}
        <span>{title}</span>
        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${badgeColor}`}>
          {todos.length}
        </span>
      </button>

      {isExpanded && (
        <div id={panelId} className="space-y-2" role="list">
          {todos.map((todo) => (
            <div key={todo.id} role="listitem">
              <TodoRow todo={todo} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

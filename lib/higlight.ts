'use client';

import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';


// Import a sleek dark theme (e.g., Tomorrow Night or Okaidia)
import 'prismjs/themes/prism-okaidia.css';

export function highlightCode(): void {
  if (typeof window !== 'undefined') {
    Prism.highlightAll();
  }
}
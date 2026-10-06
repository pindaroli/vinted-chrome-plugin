import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from '../src/sidepanel/components/ItemCard';
import { VintedItemData } from '../src/types';

describe('React Component: ItemCard', () => {
  const mockItem: VintedItemData = {
    id: '5426189512',
    title: 'Ventilateur de refroidissement pour PC',
    description: 'Ventola Noctua PC',
    price: '8.99',
    currency: 'EUR',
    brand: 'Noctua',
    size: 'Non specificata',
    condition: 'Ottime',
    details: {},
    imageUrls: [
      'https://images1.vinted.net/f800/fan-front.jpg',
      'https://images1.vinted.net/f800/fan-back.jpg',
    ],
    url: 'https://www.vinted.fr/items/5426189512',
    extractedAt: new Date().toISOString(),
    extractionSource: 'dom-fallback',
  };

  it('dovrebbe mostrare il messaggio di stato vuoto quando nessun articolo è presente', () => {
    const handleRefresh = vi.fn();
    render(
      <ItemCard
        item={null}
        isLoading={false}
        error={null}
        onRefresh={handleRefresh}
      />
    );

    expect(screen.getByText('Nessun articolo rilevato')).toBeInTheDocument();
    const btn = screen.getByText('Ricarica scheda');
    fireEvent.click(btn);
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  it('dovrebbe renderizzare correttamente i dettagli e il conteggio foto dell\'articolo', () => {
    const handleRefresh = vi.fn();
    render(
      <ItemCard
        item={mockItem}
        isLoading={false}
        error={null}
        onRefresh={handleRefresh}
      />
    );

    expect(screen.getByText('Ventilateur de refroidissement pour PC')).toBeInTheDocument();
    expect(screen.getByText('8.99 EUR')).toBeInTheDocument();
    expect(screen.getByText('Noctua')).toBeInTheDocument();

    // Badge con il numero di foto (2)
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

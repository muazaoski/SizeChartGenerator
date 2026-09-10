import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePaddleTable } from './ocr.js';

test('parses Paddle merged cells without leaking structural tags', () => {
    const raw = '<fcel>SIZE CHART<lcel><lcel><lcel><lcel><lcel><lcel><nl>' +
        '<ecel><fcel>S<fcel>M<fcel>L<fcel>XL<fcel>XXL<ecel><nl>' +
        '<fcel>CHEST<fcel>0 cm<fcel>0 cm<fcel>0 cm<fcel>8 cm<fcel>0 cm<ecel><nl>' +
        '<fcel>SHOULDER<fcel>0 cm<fcel>0 cm<fcel>0 cm<fcel>0 cm<fcel>0 cm<ecel><nl>';

    assert.deepEqual(parsePaddleTable(raw), {
        headers: ['SIZE', 'S', 'M', 'L', 'XL', 'XXL'],
        data: [
            { SIZE: 'CHEST', S: '0 cm', M: '0 cm', L: '0 cm', XL: '8 cm', XXL: '0 cm' },
            { SIZE: 'SHOULDER', S: '0 cm', M: '0 cm', L: '0 cm', XL: '0 cm', XXL: '0 cm' }
        ]
    });
});

test('continues to parse Markdown tables', () => {
    const raw = '| SIZE | CHEST |\n| --- | --- |\n| S | 50 |\n| M | 52 |';
    assert.deepEqual(parsePaddleTable(raw), {
        headers: ['SIZE', 'CHEST'],
        data: [
            { SIZE: 'S', CHEST: '50' },
            { SIZE: 'M', CHEST: '52' }
        ]
    });
});

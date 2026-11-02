'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import styles from './name-draw.module.css';

const STORAGE_KEY = 'wafi-hidden-name-draw';

function secureShuffle(values: string[]) {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    const swapIndex = Math.floor((randomValues[0] / 2 ** 32) * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export default function NameDraw() {
  const [names, setNames] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [winnerCount, setWinnerCount] = useState(1);
  const [winners, setWinners] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState('');
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedNames = window.localStorage.getItem(STORAGE_KEY);
    if (!savedNames) return;

    try {
      const parsed = JSON.parse(savedNames);
      if (Array.isArray(parsed)) setNames(parsed.filter((name) => typeof name === 'string'));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
    setWinnerCount((current) => Math.min(Math.max(current, 1), Math.max(names.length, 1)));
  }, [names]);

  useEffect(() => {
    return () => {
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  const maxWinners = Math.max(names.length, 1);
  const cardCount = winners.length || Math.min(Math.max(winnerCount, 6), 12);

  const addNames = () => {
    const incoming = draft
      .split(/\n|،|,/)
      .map((name) => name.trim())
      .filter(Boolean);

    if (!incoming.length) {
      setError('اكتب اسماً واحداً على الأقل');
      return;
    }

    const existing = new Set(names.map((name) => name.toLocaleLowerCase()));
    const uniqueIncoming = incoming.filter((name) => {
      const key = name.toLocaleLowerCase();
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });

    if (!uniqueIncoming.length) {
      setError('هذه الأسماء موجودة بالفعل');
      return;
    }

    setNames((current) => [...current, ...uniqueIncoming]);
    setDraft('');
    setError('');
    setWinners([]);
  };

  const removeName = (nameToRemove: string) => {
    setNames((current) => current.filter((name) => name !== nameToRemove));
    setWinners((current) => current.filter((name) => name !== nameToRemove));
  };

  const drawNames = () => {
    if (!names.length || isDrawing) {
      if (!names.length) setError('أضف بعض الأسماء أولاً');
      return;
    }

    const count = Math.min(winnerCount, names.length);
    const selected = secureShuffle(names).slice(0, count);

    setError('');
    setWinners([]);
    setIsDrawing(true);

    finishTimerRef.current = setTimeout(() => {
      setWinners(selected);
      setIsDrawing(false);
    }, 1900);
  };

  const resetDraw = () => {
    setWinners([]);
    setError('');
  };

  return (
    <main className={styles.page}>
      <div className={styles.ambientOne} />
      <div className={styles.ambientTwo} />
      <div className={styles.logoPattern} aria-hidden="true">
        {Array.from({ length: 9 }).map((_, index) => (
          <Image key={index} src="/matjari/WAFI.png" alt="" width={150} height={67} />
        ))}
      </div>

      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.logoMark}>
            <Image src="/matjari/WAFI.png" alt="WAFI" width={112} height={50} priority />
          </div>
          <div>
            <p className={styles.eyebrow}>اختيار عشوائي عادل</p>
            <h1>بطاقات الحظ</h1>
          </div>
          <div className={styles.totalBadge}>
            <Users size={17} />
            <span>{names.length} مشارك</span>
          </div>
        </header>

        <div className={styles.grid}>
          <aside className={styles.controlPanel}>
            <div className={styles.panelHeading}>
              <div>
                <span className={styles.step}>01</span>
                <h2>أضف المشاركين</h2>
              </div>
              {names.length > 0 && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={() => {
                    setNames([]);
                    setWinners([]);
                  }}
                  disabled={isDrawing}
                >
                  <Trash2 size={15} />
                  مسح الكل
                </button>
              )}
            </div>

            <p className={styles.help}>اكتب كل اسم في سطر، أو افصل الأسماء بفاصلة.</p>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') addNames();
              }}
              placeholder={'مثال:\nليان\nأحمد\nسارة'}
              className={styles.textarea}
              disabled={isDrawing}
            />

            <button
              type="button"
              className={styles.addButton}
              onClick={addNames}
              disabled={isDrawing}
            >
              <Plus size={18} />
              إضافة الأسماء
            </button>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.nameList}>
              {names.length === 0 ? (
                <div className={styles.emptyList}>
                  <Users size={24} />
                  <span>ستظهر الأسماء هنا</span>
                </div>
              ) : (
                names.map((name, index) => (
                  <div className={styles.nameChip} key={`${name}-${index}`}>
                    <span className={styles.avatar}>{name.charAt(0)}</span>
                    <span>{name}</span>
                    <button
                      type="button"
                      aria-label={`حذف ${name}`}
                      onClick={() => removeName(name)}
                      disabled={isDrawing}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>

          <section className={styles.stagePanel}>
            <div className={styles.selectionBar}>
              <div>
                <span className={styles.step}>02</span>
                <div>
                  <h2>عدد المختارين</h2>
                  <p>اختر كم اسماً تريد</p>
                </div>
              </div>

              <div className={styles.counter}>
                <button
                  type="button"
                  aria-label="تقليل العدد"
                  onClick={() => setWinnerCount((count) => Math.max(1, count - 1))}
                  disabled={winnerCount <= 1 || isDrawing}
                >
                  <ChevronDown size={18} />
                </button>
                <input
                  aria-label="عدد المختارين"
                  type="number"
                  min={1}
                  max={maxWinners}
                  value={winnerCount}
                  disabled={isDrawing}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setWinnerCount(Math.min(Math.max(value || 1, 1), maxWinners));
                  }}
                />
                <button
                  type="button"
                  aria-label="زيادة العدد"
                  onClick={() => setWinnerCount((count) => Math.min(maxWinners, count + 1))}
                  disabled={winnerCount >= maxWinners || isDrawing}
                >
                  <ChevronUp size={18} />
                </button>
              </div>
            </div>

            <div className={styles.cardTable}>
              <div className={styles.tableHeading}>
                <div>
                  <Sparkles size={16} />
                  <span>
                    {isDrawing
                      ? 'نخلط البطاقات...'
                      : winners.length
                        ? 'البطاقات الفائزة'
                        : 'اختر العدد ثم اكشف البطاقات'}
                  </span>
                </div>
                {winners.length > 0 && (
                  <button type="button" onClick={resetDraw}>
                    <RotateCcw size={14} />
                    إخفاء البطاقات
                  </button>
                )}
              </div>

              <div
                className={`${styles.cardDeck} ${isDrawing ? styles.shuffling : ''} ${
                  winners.length ? styles.revealed : ''
                }`}
              >
                {Array.from({ length: cardCount }).map((_, index) => {
                  const winner = winners[index];

                  return (
                    <div
                      className={styles.pickCard}
                      key={winner || `hidden-${index}`}
                      style={{ '--card-index': index } as React.CSSProperties}
                    >
                      <div className={styles.cardInner}>
                        <div className={styles.cardBack}>
                          <span className={styles.cardCorner}>W</span>
                          <Image src="/matjari/WAFI.png" alt="WAFI" width={90} height={40} />
                          <Sparkles size={20} />
                          <span className={styles.cardCornerBottom}>W</span>
                        </div>
                        <div className={styles.cardFront}>
                          <span className={styles.winnerNumber}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className={styles.winnerCheck}>
                            <Check size={18} />
                          </span>
                          <strong>{winner}</strong>
                          <span>تم الاختيار</span>
                          <Image src="/matjari/WAFI.png" alt="" width={52} height={23} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className={styles.drawButton}
              onClick={drawNames}
              disabled={!names.length || isDrawing}
            >
              <Sparkles size={20} />
              {isDrawing ? 'جاري خلط البطاقات...' : winners.length ? 'سحب بطاقات جديدة' : 'اكشف البطاقات'}
            </button>
          </section>
        </div>

        <footer className={styles.footer}>
          <Image src="/matjari/WAFI.png" alt="WAFI" width={56} height={25} />
          <span>اختيار عشوائي بدون تكرار</span>
          <span>•</span>
          <span>تُحفظ الأسماء على جهازك فقط</span>
        </footer>
      </section>
    </main>
  );
}

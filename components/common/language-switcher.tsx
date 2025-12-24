'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const changeLocale = (locale: string) => {
    const segments = pathname.split('/');
    segments[1] = locale; // /[locale]/...
    router.push(segments.join('/'));
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => changeLocale('en')}>EN</button>
      <button onClick={() => changeLocale('ko')}>KO</button>
    </div>
  );
}

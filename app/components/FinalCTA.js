'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className='bg-[#F2F2F3] text-[#131217] pt-24 sm:pt-32 pb-20 sm:pb-28 px-6 sm:px-8'>
      <div className='max-w-[1320px] mx-auto flex flex-col justify-between gap-20 sm:gap-28'>
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className='font-semibold tracking-[-0.04em] leading-[0.94] max-w-5xl'
          style={{
            fontSize: 'clamp(2.65rem, 7.2vw, 6.25rem)',
            textWrap: 'balance',
          }}
        >
          Start with one
          <br />
          repository.
        </motion.h2>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-end'>
          <p className='lg:col-span-5 text-base sm:text-lg text-[#3A3A40] leading-relaxed max-w-[42ch]'>
            Create an organization, connect your GitHub App, and configure your first project in under two minutes.
          </p>

          <div className='lg:col-span-7 flex flex-wrap lg:justify-end items-center gap-6'>
            <Link
              href='/docs/quick-start'
              className='text-sm font-medium text-[#3A3A40] hover:text-[#131217] underline underline-offset-4 transition-colors duration-150'
            >
              Read quick start
            </Link>
            <Link
              href='/signup'
              className='inline-flex items-center justify-center gap-2 h-14 px-8 bg-[#131217] hover:bg-[#23222A] text-[#F2F2F3] text-sm font-medium transition-colors duration-150 w-full sm:w-auto'
            >
              <span>Create an account</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

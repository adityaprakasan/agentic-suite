'use client';

import { SectionHeader } from '@/components/home/section-header';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

export function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section
      id="problem"
      className="flex flex-col items-center justify-center w-full relative"
      ref={ref}
    >
      <div className="relative w-full px-6">
        <div className="max-w-6xl mx-auto border-l border-r border-border">
          <SectionHeader>
            <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
              Success shouldn't turn you into a middle manager.
            </h2>
          </SectionHeader>

          <div className="border-t border-border p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
                You started a brand to create products. But once you hit $1M, the <span className="font-semibold text-foreground">"Owner's Trap"</span> sets in.
              </p>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-center">
                Instead of building, you're stuck "gluing" apps together. <span className="font-semibold text-foreground">You are the bottleneck.</span>
              </p>

              <div className="pt-4 flex justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20"
                >
                  <span className="text-lg md:text-xl font-semibold text-primary">
                    Stop being the machine. Start being the owner.
                  </span>
                </motion.div>
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
                  className="text-base text-muted-foreground leading-relaxed text-center"
                >
                  Adentic isn't just one AI—it's a <span className="font-semibold text-foreground">team of specialized agents</span> working together. One watches competitors, another guards margins, another handles support.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
                  className="text-base font-semibold text-foreground text-center mt-3"
                >
                  More reliable. More value. Like a full operations team.
                </motion.p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}


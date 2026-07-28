import fs from 'fs';

let content = fs.readFileSync('src/components/Pricing.tsx', 'utf-8');

const correctBlock = `
          >
            <div className="w-2 h-2 bg-teal rounded-full" />
            Live booking catalog
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold text-navy mb-6 leading-tight"
          >
            Services built for homes <br />
            <span className="text-teal">that expect better</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed"
          >
            Explore transparent service options across maintenance, HVAC, deep cleaning, home planning, and construction. Each request is routed to the right professional team.
          </motion.p>
`;

// I will just find the start of the block and replace up to the end.
const startRegex = /<motion\.div[\s\S]*?className="inline-flex items-center gap-2 px-5 py-2 bg-teal\/10 rounded-full border border-teal\/15 text-teal text-\[10px\] font-bold uppercase tracking-\[0\.12em\] mb-8 whitespace-nowrap"[\s\S]*?>[\s\S]*?<div className="w-2 h-2 bg-teal rounded-full" \/>[\s\S]*?Live booking catalog[\s\S]*?<\/motion\.div>[\s\S]*?(?:<motion\.h2[\s\S]*?<\/motion\.h2>[\s\S]*?<motion\.p[\s\S]*?<\/motion\.p>|<motion\.h2[\s\S]*?<\/motion\.div>[\s\S]*?<motion\.h2[\s\S]*?<\/motion\.h2>[\s\S]*?<motion\.p[\s\S]*?<\/motion\.p>|<motion\.p[\s\S]*?<\/motion\.p>)/;

// Let's use a simpler replace by doing indexOf
const anchor = `className="inline-flex items-center gap-2 px-5 py-2 bg-teal/10 rounded-full border border-teal/15 text-teal text-[10px] font-bold uppercase tracking-[0.12em] mb-8 whitespace-nowrap"`;
const idx = content.indexOf(anchor);

if (idx !== -1) {
    const startIdx = content.lastIndexOf('<motion.div', idx);
    const endIdx = content.indexOf('</div>\n\n        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">', idx);
    
    if (startIdx !== -1 && endIdx !== -1) {
        const replacement = `<motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-teal/10 rounded-full border border-teal/15 text-teal text-[10px] font-bold uppercase tracking-[0.12em] mb-8 whitespace-nowrap"
          >
            <div className="w-2 h-2 bg-teal rounded-full" />
            Live booking catalog
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold text-navy mb-6 leading-tight"
          >
            Services built for homes <br />
            <span className="text-teal">that expect better</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed"
          >
            Explore transparent service options across maintenance, HVAC, deep cleaning, home planning, and construction. Each request is routed to the right professional team.
          </motion.p>
        `;
        
        content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
        fs.writeFileSync('src/components/Pricing.tsx', content);
        console.log('Pricing.tsx header section fixed');
    } else {
        console.log('Could not find start or end bounds');
    }
} else {
    console.log('Could not find anchor string');
}

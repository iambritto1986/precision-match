const fs = require('fs');
let code = fs.readFileSync('src/components/ResumeTemplates.tsx', 'utf8');

// Fix pageBreaks
code = code.replace(/pageBreaks\?\.has\(([^)]+)\)/g, 'pageBreaks?.[]');

// Fix data.summary
code = code.replace(/data\.summary/g, 'data.personalDetails.summary');

// Fix experience
code = code.replace(/exp\.title/g, 'exp.role');
code = code.replace(/exp\.startDate( \+?['" \-?"]+ \+? )exp\.endDate/g, 'exp.duration');
code = code.replace(/exp\.startDate(.*?)\} - \{\s*exp\.endDate/g, 'exp.duration');
code = code.replace(/\{exp\.startDate\} - \{exp\.endDate\}/g, '{exp.duration}');
code = code.replace(/\{exp\.startDate\} \?" \{exp\.endDate\}/g, '{exp.duration}');
code = code.replace(/exp\.description/g, 'exp.responsibilities');

// Fix education
code = code.replace(/edu\.school/g, 'edu.institution');
code = code.replace(/edu\.startDate( \+?['" \-?"]+ \+? )edu\.endDate/g, 'edu.duration');
code = code.replace(/edu\.startDate(.*?)\} - \{\s*edu\.endDate/g, 'edu.duration');
code = code.replace(/\{edu\.startDate\} - \{edu\.endDate\}/g, '{edu.duration}');
code = code.replace(/\{edu\.startDate\} \?" \{edu\.endDate\}/g, '{edu.duration}');

// Fix skills
code = code.replace(/skill\.name/g, 'skill.category');
code = code.replace(/skill\.level/g, "skill.items.join(', ')");
code = code.replace(/s\.name/g, 's.category');

fs.writeFileSync('src/components/ResumeTemplates.tsx', code);
console.log('Fixed');

/**
 * OpportunityBridge Transparent Rule-Based Matcher Service
 * Evaluates academic branch eligibility, year of study eligibility,
 * skill overlap (with synonym support), and interest alignment.
 */

// Comprehensive Tech & Academic Synonyms (Bidirectional Equivalents)
export const SYNONYMS = {
  // Web & Frontend
  'javascript': ['js', 'es6'],
  'js': ['javascript', 'es6'],
  'react': ['react.js', 'reactjs'],
  'react.js': ['react', 'reactjs'],
  'reactjs': ['react', 'react.js'],
  'html': ['html5'],
  'html5': ['html'],
  'css': ['css3', 'styling'],
  'css3': ['css', 'styling'],
  'frontend': ['front end', 'ui'],
  'front end': ['frontend'],
  'web development': ['web dev', 'web', 'web design'],
  'web dev': ['web development'],
  'fullstack': ['full stack', 'web development'],
  'full stack': ['fullstack', 'web development'],

  // Backend & Languages
  'backend': ['back end', 'server'],
  'back end': ['backend'],
  'python': ['py', 'python3'],
  'py': ['python'],
  'python3': ['python'],
  'c++': ['cpp', 'c / c++', 'c/c++'],
  'cpp': ['c++', 'c / c++'],
  'java': ['jvm', 'core java'],
  'git': ['github', 'gitlab', 'version control', 'open-source', 'open source', 'oss'],
  'github': ['git', 'version control', 'open source'],
  'open-source': ['open source', 'git', 'github', 'oss'],
  'open source': ['open-source', 'git', 'github', 'oss'],

  // AI & Machine Learning
  'ai': ['artificial intelligence', 'genai', 'generative ai'],
  'artificial intelligence': ['ai'],
  'ai/ml': ['ai', 'machine learning'],
  'ai / ml': ['ai', 'machine learning'],
  'machine learning': ['ml', 'deep learning'],
  'ml': ['machine learning', 'deep learning'],
  'deep learning': ['machine learning', 'neural networks'],
  'data science': ['data analytics', 'analytics', 'statistics'],

  // CAD & Prototyping
  'cad': ['computer aided design', 'computer-aided design', '3d modeling', 'solidworks', 'autocad', 'catia', 'fusion 360'],
  'computer aided design': ['cad', '3d modeling'],
  '3d modeling': ['cad'],
  'prototype': ['prototyping', 'cad', 'hardware', 'builder', 'hackathon'],

  // Robotics & Embedded Systems
  'robotics': ['mechatronics', 'ros', 'robot operating system', 'automation'],
  'mechatronics': ['robotics'],
  'ros': ['robotics'],
  'autonomy': ['autonomous'],
  'drones': ['uav'],
  'embedded systems': ['embedded', 'microcontrollers', 'firmware', 'arduino', 'raspberry pi'],
  'embedded': ['embedded systems', 'firmware'],
  'iot': ['internet of things', 'embedded systems'],

  // Space & Research
  'space': ['aerospace', 'astronomy', 'space science', 'isro', 'satellites'],
  'aerospace': ['space', 'satellites', 'drones'],
  'satellites': ['satellites', 'satellite', 'space', 'aerospace'],
  'research': ['scientific', 'academic', 'fellowship', 'lab'],
  'fellowship': ['fellowship', 'research', 'academic', 'scholarship'],

  // Competitions
  'hackathon': ['hackathons', 'coding competition', 'builder'],
  'hackathons': ['hackathon']
};

// Skill-to-Tag Mappings: connects specific student skills to relevant opportunity domain tags
export const SKILL_TAG_MAP = {
  // Web & Frontend Skills -> Software, Web, Open-Source
  'javascript': ['software', 'web development', 'frontend'],
  'js': ['software', 'web development', 'frontend'],
  'react': ['software', 'web development', 'frontend'],
  'react.js': ['software', 'web development', 'frontend'],
  'reactjs': ['software', 'web development', 'frontend'],
  'html': ['software', 'web development', 'frontend'],
  'html5': ['software', 'web development', 'frontend'],
  'css': ['software', 'web development', 'frontend'],
  'css3': ['software', 'web development', 'frontend'],
  'frontend': ['software', 'web development', 'frontend'],
  'front end': ['software', 'web development', 'frontend'],
  'backend': ['software', 'web development', 'backend'],
  'back end': ['software', 'web development', 'backend'],
  'web development': ['software', 'web development', 'frontend', 'backend'],
  'web': ['software', 'web development'],

  // General Programming & Open Source
  'python': ['software', 'python', 'scripting', 'programming'],
  'py': ['software', 'python'],
  'python3': ['software', 'python'],
  'c++': ['software', 'c++', 'embedded systems', 'robotics'],
  'cpp': ['software', 'c++', 'embedded systems', 'robotics'],
  'java': ['software', 'java', 'backend'],
  'git': ['open-source', 'open source', 'software'],
  'github': ['open-source', 'open source', 'software'],
  'open source': ['open-source', 'open source', 'software'],
  'open-source': ['open-source', 'open source', 'software'],

  // AI & ML
  'ai': ['ai', 'artificial intelligence', 'machine learning'],
  'artificial intelligence': ['ai', 'artificial intelligence', 'machine learning'],
  'machine learning': ['ai', 'artificial intelligence', 'machine learning'],
  'ml': ['ai', 'artificial intelligence', 'machine learning'],
  'deep learning': ['ai', 'artificial intelligence', 'machine learning'],
  'data science': ['ai', 'data science', 'software'],

  // CAD, Robotics & Embedded Systems
  'cad': ['cad', 'prototype', 'hardware'],
  'computer aided design': ['cad', 'prototype', 'hardware'],
  '3d modeling': ['cad', 'prototype', 'hardware'],
  'prototype': ['prototype', 'cad', 'hardware'],
  'robotics': ['robotics', 'autonomy', 'hardware'],
  'autonomy': ['robotics', 'autonomy'],
  'drones': ['robotics', 'drones', 'aerospace'],
  'embedded systems': ['embedded systems', 'embedded', 'iot', 'hardware'],
  'embedded': ['embedded systems', 'embedded', 'iot', 'hardware'],
  'iot': ['embedded systems', 'iot', 'hardware'],
  'firmware': ['embedded systems', 'hardware']
};

/**
 * Normalizes skill/tag strings for consistent comparison:
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips leading/trailing punctuation (like commas, periods, quotes, colons, brackets),
 *   while preserving meaningful technical characters like '+' (C++) and '#' (C#)
 * - Normalizes hyphens, underscores, and consecutive spaces into single spaces
 */
export function normalizeSkill(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .toLowerCase()
    .trim()
    .replace(/^[^\w+#]+|[^\w+#]+$/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two normalized terms match directly or as whole words/phrases
 * Prevents substring collisions (e.g. 'ai' in 'railway' or 'sustainability')
 */
function isDirectOrWordMatch(a, b) {
  if (a === b) return true;
  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  if (wordsA.includes(b) || wordsB.includes(a)) return true;
  if (wordsA.length > 1 && wordsB.length > 1) {
    if (a.includes(b) || b.includes(a)) return true;
  }
  return false;
}

/**
 * Match a student skill/interest with an opportunity tag
 */
export function matchSkillOrTag(sItem, oppTag) {
  const s = normalizeSkill(sItem);
  const t = normalizeSkill(oppTag);
  if (!s || !t) return false;

  // 1. Direct or whole-word match
  if (isDirectOrWordMatch(s, t)) return true;

  // 2. Bidirectional synonyms of s
  const synsS = SYNONYMS[s] || [];
  for (const syn of synsS) {
    const n = normalizeSkill(syn);
    if (isDirectOrWordMatch(n, t)) return true;
  }

  // 3. Bidirectional synonyms of t
  const synsT = SYNONYMS[t] || [];
  for (const syn of synsT) {
    const n = normalizeSkill(syn);
    if (isDirectOrWordMatch(n, s)) return true;
  }

  // 4. Directional Skill-to-Tag mapping: student skill qualifies for opportunity tag
  const mappedTags = SKILL_TAG_MAP[s] || [];
  for (const tag of mappedTags) {
    const n = normalizeSkill(tag);
    if (isDirectOrWordMatch(n, t)) return true;
  }

  return false;
}

/**
 * Evaluates Branch / Discipline Eligibility
 */
function checkFieldMatch(studentDegree, studentBranch, eligibleFields) {
  if (!eligibleFields || eligibleFields.length === 0) {
    return { match: true, reason: 'Open to all academic disciplines' };
  }

  const sBranch = (studentBranch || '').toLowerCase().trim();
  const sDegree = (studentDegree || '').toLowerCase().trim();
  const fields = eligibleFields.map(f => f.toLowerCase().trim());

  if (fields.some(f => f.includes('all field') || f.includes('any field') || f === 'all')) {
    return { match: true, reason: 'Open to all academic disciplines' };
  }

  // 1. Direct branch text match
  for (const f of fields) {
    if (sBranch && (sBranch.includes(f) || f.includes(sBranch))) {
      return { match: true, reason: `Direct branch match (${f})` };
    }
  }

  // 2. Discipline category mapping
  const isCSE = sBranch.includes('computer science') || sBranch.includes('cse') || sBranch.includes('software');
  const isIT = sBranch.includes('information technology') || sBranch.includes('it');
  const isEngineeringDegree = sDegree.includes('b.tech') || sDegree.includes('b.e') || sDegree.includes('engineering') || sBranch.includes('engineering');
  const isScienceDegree = sDegree.includes('b.sc') || sDegree.includes('m.sc') || sDegree.includes('science') || sBranch.includes('science');

  // Computer Science specific
  if (fields.some(f => f === 'computer science') && isCSE) {
    return { match: true, reason: 'Direct branch match (Computer Science)' };
  }

  // Technology broad field
  if (fields.some(f => f === 'technology') && (isIT || isCSE || isEngineeringDegree)) {
    return { match: true, reason: 'Technology discipline match' };
  }

  // Engineering broad field (requires an engineering degree/branch)
  if (fields.some(f => f === 'engineering') && isEngineeringDegree) {
    return { match: true, reason: 'Engineering degree match' };
  }

  // Science broad field (B.Sc or natural sciences)
  if (fields.some(f => f === 'science') && (isScienceDegree || isCSE || isIT)) {
    return { match: true, reason: 'Science curriculum match' };
  }

  // Ineligible for branch
  return { 
    match: false, 
    reason: `Requires ${eligibleFields.join(' / ')} (Student is ${studentBranch || studentDegree || 'other field'})` 
  };
}

/**
 * Evaluates Year of Study Eligibility
 */
function checkYearMatch(studentYear, eligibleYears) {
  if (!eligibleYears || eligibleYears.length === 0) {
    return { match: true, reason: 'Open to all academic years' };
  }

  const years = eligibleYears.map(y => y.toLowerCase().trim());
  if (years.some(y => y.includes('all year') || y.includes('all'))) {
    return { match: true, reason: 'Open to all years of study' };
  }

  const yearNum = parseInt(studentYear, 10) || 3;
  let matches = false;

  if (yearNum === 1 && years.some(y => y.includes('1st') || y.includes('first'))) matches = true;
  if (yearNum === 2 && years.some(y => y.includes('2nd') || y.includes('second'))) matches = true;
  if (yearNum === 3 && years.some(y => y.includes('3rd') || y.includes('third'))) matches = true;
  if (yearNum === 4 && years.some(y => y.includes('4th') || y.includes('fourth') || y.includes('final'))) matches = true;
  if (yearNum >= 5 && years.some(y => y.includes('postgraduate') || y.includes('master') || y.includes('phd'))) matches = true;

  if (matches) {
    return { match: true, reason: `Eligible for Year ${yearNum} students` };
  }

  return {
    match: false,
    reason: `Requires ${eligibleYears.join(', ')} (Student is Year ${yearNum})`
  };
}

/**
 * Main calculateMatch function
 */
export function calculateMatch(opportunity, profile) {
  if (!profile) {
    return {
      score: 50,
      percentage: '50%',
      matchLevel: 'Baseline Match',
      isEligible: true,
      breakdown: {
        skills: { score: 15, matched: [], missing: [] },
        interests: { score: 10, matched: [] },
        eligibility: { fieldMatch: true, yearMatch: true, score: 25 }
      },
      summary: 'Complete your student profile to see personalized matches.'
    };
  }

  const studentSkills = Array.isArray(profile.skills) ? profile.skills : [];
  const studentInterests = Array.isArray(profile.interests) ? profile.interests : [];
  const studentBranch = profile.branch || profile.field_of_study || '';
  const studentDegree = profile.degree || '';
  const studentYear = profile.year_of_study || profile.year || 3;

  const oppTags = (opportunity.skills_required || opportunity.tags || []);
  const oppCategory = (opportunity.category || opportunity.type || '').toLowerCase();
  const oppEligibility = opportunity.eligibility || {};

  // 1. Branch / Field Eligibility (Max 25 pts)
  const fieldResult = checkFieldMatch(studentDegree, studentBranch, oppEligibility.fields);
  const fieldScore = fieldResult.match ? 25 : 0;

  // 2. Year Eligibility (Max 20 pts)
  const yearResult = checkYearMatch(studentYear, oppEligibility.years);
  const yearScore = yearResult.match ? 20 : 0;

  // 3. Technical Skill Matching (Max 35 pts)
  const matchedSkills = [];
  const missingSkills = [];
  oppTags.forEach(tag => {
    const isMatched = studentSkills.some(skill => matchSkillOrTag(skill, tag));
    if (isMatched) {
      matchedSkills.push(tag);
    } else {
      missingSkills.push(tag);
    }
  });

  const skillRatio = oppTags.length > 0 ? (matchedSkills.length / oppTags.length) : 0.5;
  const skillScore = Math.round(skillRatio * 35);

  // 4. Interest & Category Alignment (Max 20 pts)
  const matchedInterests = [];
  studentInterests.forEach(interest => {
    const matchesTag = oppTags.some(tag => matchSkillOrTag(interest, tag));
    const matchesCategory = matchSkillOrTag(interest, oppCategory);
    if (matchesTag || matchesCategory) {
      matchedInterests.push(interest);
    }
  });

  const interestRatio = studentInterests.length > 0
    ? Math.min(matchedInterests.length / Math.max(studentInterests.length, 1), 1)
    : 0.5;
  const interestScore = Math.round(interestRatio * 20);

  // Raw Total
  let rawScore = fieldScore + yearScore + skillScore + interestScore;

  // Academic Eligibility Guardrail:
  // If student fails strictly on Year (e.g. 1st year only scholarship for a Year 2/3 student)
  // or fails on Field (e.g. Photography for an IT student), cap the score.
  const isFullyEligible = fieldResult.match && yearResult.match;
  if (!yearResult.match && !fieldResult.match) {
    rawScore = Math.min(rawScore, 20); // Ineligible for both
  } else if (!yearResult.match) {
    rawScore = Math.min(rawScore, 35); // Wrong academic year
  } else if (!fieldResult.match) {
    rawScore = Math.min(rawScore, 40); // Wrong branch
  }

  const finalScore = Math.min(100, Math.max(10, rawScore));

  // Determine Match Level
  let matchLevel = 'Low Fit';
  if (!isFullyEligible) {
    matchLevel = !yearResult.match && !fieldResult.match 
      ? 'Ineligible' 
      : (!yearResult.match ? 'Year Ineligible' : 'Branch Unmatched');
  } else if (finalScore >= 75) {
    matchLevel = 'Strong Match';
  } else if (finalScore >= 55) {
    matchLevel = 'Moderate Match';
  } else {
    matchLevel = 'Eligible Match';
  }

  // Generate Clear Human-Readable Explanation
  const summaryPoints = [];
  if (fieldResult.match) {
    summaryPoints.push(fieldResult.reason);
  } else {
    summaryPoints.push(fieldResult.reason);
  }

  if (yearResult.match) {
    summaryPoints.push(`Year ${studentYear} eligible`);
  } else {
    summaryPoints.push(yearResult.reason);
  }

  if (matchedSkills.length > 0) {
    summaryPoints.push(`${matchedSkills.length} matching skill${matchedSkills.length > 1 ? 's' : ''} (${matchedSkills.slice(0, 3).join(', ')})`);
  }

  return {
    score: finalScore,
    percentage: `${finalScore}%`,
    matchLevel,
    isEligible: isFullyEligible,
    breakdown: {
      field: {
        matched: fieldResult.match,
        reason: fieldResult.reason,
        score: fieldScore
      },
      year: {
        matched: yearResult.match,
        reason: yearResult.reason,
        score: yearScore
      },
      skills: {
        score: skillScore,
        matched: matchedSkills,
        missing: missingSkills.slice(0, 3)
      },
      interests: {
        score: interestScore,
        matched: matchedInterests
      }
    },
    summary: summaryPoints.join(' • ')
  };
}

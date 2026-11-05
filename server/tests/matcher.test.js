import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateMatch,
  matchSkillOrTag,
  normalizeSkill,
  SYNONYMS,
  SKILL_TAG_MAP
} from '../src/services/matcher.js';

describe('Skill Normalization & Prevention of False Collisions', () => {
  it('normalizes case, extra whitespace, and punctuation', () => {
    assert.strictEqual(normalizeSkill('  JAVASCRIPT  '), 'javascript');
    assert.strictEqual(normalizeSkill('Python,'), 'python');
    assert.strictEqual(normalizeSkill('React.js...'), 'react.js');
    assert.strictEqual(normalizeSkill('  web   development  '), 'web development');
    assert.strictEqual(normalizeSkill('open-source'), 'open source');
    assert.strictEqual(normalizeSkill('embedded_systems'), 'embedded systems');
  });

  it('preserves meaningful technical characters (+ in C++, # in C#)', () => {
    assert.strictEqual(normalizeSkill('C++'), 'c++');
    assert.strictEqual(normalizeSkill('C++,'), 'c++');
    assert.strictEqual(normalizeSkill('C#'), 'c#');
  });

  it('prevents naive substring collision on short acronyms', () => {
    // "ai" must not match "railway" or "sustainability"
    assert.strictEqual(matchSkillOrTag('AI', 'railway'), false);
    assert.strictEqual(matchSkillOrTag('AI', 'sustainability'), false);

    // "cad" must not match "academies"
    assert.strictEqual(matchSkillOrTag('CAD', 'academies'), false);

    // "ml" must not match "html"
    assert.strictEqual(matchSkillOrTag('ML', 'html'), false);
  });
});

describe('16 Required Student Skills Tag Coverage', () => {
  const reqSkills = [
    { skill: 'JavaScript', expectedTags: ['software', 'web development', 'frontend'] },
    { skill: 'React', expectedTags: ['software', 'web development', 'frontend'] },
    { skill: 'Git', expectedTags: ['software', 'open-source'] },
    { skill: 'HTML', expectedTags: ['software', 'web development', 'frontend'] },
    { skill: 'CSS', expectedTags: ['software', 'web development', 'frontend'] },
    { skill: 'Python', expectedTags: ['software', 'python'] },
    { skill: 'C++', expectedTags: ['software', 'c++', 'embedded systems', 'robotics'] },
    { skill: 'Java', expectedTags: ['software', 'java', 'backend'] },
    { skill: 'web development', expectedTags: ['software', 'web development', 'frontend', 'backend'] },
    { skill: 'frontend', expectedTags: ['software', 'web development', 'frontend'] },
    { skill: 'backend', expectedTags: ['software', 'web development', 'backend'] },
    { skill: 'AI', expectedTags: ['ai', 'artificial intelligence', 'machine learning'] },
    { skill: 'machine learning', expectedTags: ['ai', 'artificial intelligence', 'machine learning'] },
    { skill: 'CAD', expectedTags: ['cad', 'prototype'] },
    { skill: 'robotics', expectedTags: ['robotics', 'autonomy'] },
    { skill: 'embedded systems', expectedTags: ['embedded systems', 'iot'] }
  ];

  for (const { skill, expectedTags } of reqSkills) {
    it(`correctly maps skill "${skill}" to relevant tags`, () => {
      for (const tag of expectedTags) {
        assert.strictEqual(
          matchSkillOrTag(skill, tag),
          true,
          `Expected skill "${skill}" to match tag "${tag}"`
        );
      }
    });
  }
});

describe('Score Responsiveness to Relevant Skills vs Unrelated Skills', () => {
  const profileBase = {
    name: 'Test Student',
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering',
    year: 2,
    interests: ['Software Development']
  };

  const fosseeOpp = {
    id: 'fossee-winter-internship-2026',
    title: 'FOSSEE Winter Internship 2026',
    type: 'internship',
    eligibility: {
      years: ['2nd year', '3rd year', '4th year'],
      fields: ['Engineering', 'Science', 'Computer Science']
    },
    skills_required: ['open-source', 'research', 'software', 'remote']
  };

  const farmRoboticsOpp = {
    id: 'farm-robotics-challenge-2027',
    title: 'Farm Robotics Challenge 2027',
    type: 'competition',
    eligibility: {
      years: ['2nd year', '3rd year', '4th year'],
      fields: ['Engineering', 'Agriculture', 'Technology']
    },
    skills_required: ['competition', 'robotics', 'agriculture', 'autonomy']
  };

  const robonautsOpp = {
    id: 'robonauts-robotics-ai-automation-2026',
    title: 'Robonauts Robotics & AI Automation Fellowship',
    type: 'fellowship',
    eligibility: {
      years: ['2nd year', '3rd year', '4th year'],
      fields: ['Engineering', 'Technology', 'Science']
    },
    skills_required: ['robotics', 'artificial intelligence', 'embedded systems', 'iot']
  };

  const spaceLabBatch2Opp = {
    id: 'india-space-lab-winter-internship-2026-batch2',
    title: 'India Space Lab Winter Internship (Batch II)',
    type: 'internship',
    eligibility: {
      years: ['2nd year', '3rd year', '4th year'],
      fields: ['Engineering', 'Science', 'Technology']
    },
    skills_required: ['space', 'robotics', 'satellites', 'drones', 'python']
  };

  const photographyOpp = {
    id: 'sony-world-photography-student-2026',
    title: 'Sony World Photography Awards',
    type: 'competition',
    eligibility: {
      years: ['1st year', '2nd year', '3rd year', '4th year'],
      fields: ['Arts', 'Design', 'Photography']
    },
    skills_required: ['competition', 'photography', 'arts', 'global']
  };

  const railwayOpp = {
    id: 'imeche-railway-challenge-2027',
    title: 'IMechE Railway Challenge 2027',
    type: 'competition',
    eligibility: {
      years: ['2nd year', '3rd year', '4th year'],
      fields: ['Engineering']
    },
    skills_required: ['competition', 'engineering', 'railway', 'team']
  };

  const scholarshipOpp = {
    id: 'kotak-kanya-scholarship-2026',
    title: 'Kotak Kanya Scholarship',
    type: 'scholarship',
    eligibility: {
      years: ['1st year'],
      fields: ['Engineering', 'Medicine']
    },
    skills_required: ['scholarship', 'women', 'merit-cum-means', 'professional-degree']
  };

  it('relevant web skills (JavaScript, React, Git) increase FOSSEE score', () => {
    const baseResult = calculateMatch(fosseeOpp, { ...profileBase, skills: [] });
    const withWebSkills = calculateMatch(fosseeOpp, {
      ...profileBase,
      skills: ['JavaScript', 'React', 'Git', 'HTML', 'CSS']
    });

    assert.ok(withWebSkills.score > baseResult.score, `Expected ${withWebSkills.score} > ${baseResult.score}`);
    assert.deepStrictEqual(withWebSkills.breakdown.skills.matched.sort(), ['open-source', 'software'].sort());
  });

  it('adding Python with trailing punctuation increases Python-tagged opportunities', () => {
    const baseResult = calculateMatch(spaceLabBatch2Opp, { ...profileBase, skills: [] });
    const withPython = calculateMatch(spaceLabBatch2Opp, {
      ...profileBase,
      skills: ['Python,'] // Test dirty trailing comma
    });

    assert.ok(withPython.score > baseResult.score, `Expected ${withPython.score} > ${baseResult.score}`);
    assert.ok(withPython.breakdown.skills.matched.includes('python'));
  });

  it('relevant robotics, CAD and embedded systems skills increase robotics scores', () => {
    const baseRobo = calculateMatch(farmRoboticsOpp, { ...profileBase, skills: [] });
    const withRoboSkills = calculateMatch(farmRoboticsOpp, {
      ...profileBase,
      skills: ['Robotics', 'CAD', 'Embedded Systems']
    });

    assert.ok(withRoboSkills.score > baseRobo.score, `Expected ${withRoboSkills.score} > ${baseRobo.score}`);
    assert.ok(withRoboSkills.breakdown.skills.matched.includes('robotics'));
    assert.ok(withRoboSkills.breakdown.skills.matched.includes('autonomy'));

    // Check Robonauts
    const baseRobonauts = calculateMatch(robonautsOpp, { ...profileBase, skills: [] });
    const withEmbedded = calculateMatch(robonautsOpp, {
      ...profileBase,
      skills: ['Robotics', 'CAD', 'Embedded Systems']
    });
    assert.ok(withEmbedded.score > baseRobonauts.score, `Expected ${withEmbedded.score} > ${baseRobonauts.score}`);
    assert.ok(withEmbedded.breakdown.skills.matched.includes('robotics'));
    assert.ok(withEmbedded.breakdown.skills.matched.includes('embedded systems'));
    assert.ok(withEmbedded.breakdown.skills.matched.includes('iot'));
  });

  it('unrelated skills do NOT change match scores (0 delta)', () => {
    const oppsToTest = [fosseeOpp, farmRoboticsOpp, robonautsOpp, photographyOpp, railwayOpp, scholarshipOpp];

    for (const opp of oppsToTest) {
      const baseResult = calculateMatch(opp, { ...profileBase, skills: [] });
      const unrelatedResult = calculateMatch(opp, {
        ...profileBase,
        skills: ['Cooking', 'Gardening', 'Singing']
      });

      assert.strictEqual(
        unrelatedResult.score,
        baseResult.score,
        `Expected ${opp.id} score to remain ${baseResult.score}, got ${unrelatedResult.score}`
      );
      assert.strictEqual(
        unrelatedResult.breakdown.skills.matched.length,
        0,
        `Expected 0 matched skills for ${opp.id}`
      );
    }
  });

  it('technical skills do NOT inflate unrelated non-technical opportunities', () => {
    const techSkills = ['JavaScript', 'React', 'Git', 'Python,', 'C++', 'CAD', 'Robotics', 'Embedded Systems'];

    // Photography competition must remain at baseline
    const photoBase = calculateMatch(photographyOpp, { ...profileBase, skills: [] });
    const photoWithTech = calculateMatch(photographyOpp, { ...profileBase, skills: techSkills });
    assert.strictEqual(photoWithTech.score, photoBase.score);
    assert.strictEqual(photoWithTech.breakdown.skills.matched.length, 0);

    // Railway challenge must remain at baseline for pure web/software skills
    const railwayBase = calculateMatch(railwayOpp, { ...profileBase, skills: [] });
    const railwayWithWeb = calculateMatch(railwayOpp, { ...profileBase, skills: ['JavaScript', 'React', 'Git'] });
    assert.strictEqual(railwayWithWeb.score, railwayBase.score);

    // Scholarships must not receive artificial skill boosts
    const scholarshipBase = calculateMatch(scholarshipOpp, { ...profileBase, skills: [] });
    const scholarshipWithTech = calculateMatch(scholarshipOpp, { ...profileBase, skills: techSkills });
    assert.strictEqual(scholarshipWithTech.score, scholarshipBase.score);
  });
});

describe('Scoring Weights and Eligibility Rules Invariance', () => {
  it('preserves field, year, skill and interest weight distribution', () => {
    const fullMatchOpp = {
      id: 'ideal-match',
      title: 'Ideal Opportunity',
      type: 'internship',
      category: 'internship',
      eligibility: {
        years: ['2nd year'],
        fields: ['Computer Science']
      },
      skills_required: ['software']
    };

    const student = {
      degree: 'B.Tech',
      branch: 'Computer Science',
      year: 2,
      skills: ['JavaScript'],
      interests: ['software']
    };

    const result = calculateMatch(fullMatchOpp, student);
    assert.strictEqual(result.breakdown.field.score, 25);
    assert.strictEqual(result.breakdown.year.score, 20);
    assert.strictEqual(result.breakdown.skills.score, 35);
    assert.strictEqual(result.breakdown.interests.score, 20);
    assert.strictEqual(result.score, 100);
    assert.strictEqual(result.matchLevel, 'Strong Match');
  });

  it('preserves academic guardrails when student is year-ineligible', () => {
    const finalYearOpp = {
      id: 'final-year-only',
      title: 'Final Year Fellowship',
      eligibility: {
        years: ['4th year'],
        fields: ['Computer Science']
      },
      skills_required: ['software']
    };

    const studentYear2 = {
      degree: 'B.Tech',
      branch: 'Computer Science',
      year: 2,
      skills: ['JavaScript'],
      interests: ['software']
    };

    const result = calculateMatch(finalYearOpp, studentYear2);
    assert.ok(result.score <= 35, `Expected score <= 35 due to year guardrail, got ${result.score}`);
    assert.strictEqual(result.isEligible, false);
    assert.strictEqual(result.matchLevel, 'Year Ineligible');
  });
});

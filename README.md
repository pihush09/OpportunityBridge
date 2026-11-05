# OpportunityBridge – Your AI-Powered Student Opportunity Assistant

**Discover opportunities. Check your eligibility. Never miss a deadline.**

OpportunityBridge is a student-focused platform that helps college students discover relevant internships, scholarships, hackathons, fellowships, and competitions based on their academic background, skills, and interests.

It combines personalised opportunity matching with Switch-powered AI agent workflows to help students find and organise opportunities more effectively.

## Key Features

- **Personalised Dashboard:** Get an overview of opportunities, matches, saved items, and upcoming deadlines.
- **Opportunity Discovery:** Explore internships, scholarships, fellowships, hackathons, and competitions.
- **Eligibility Matching:** Match opportunities against your degree, branch, academic year, skills, and interests.
- **Match Explanations:** Understand why an opportunity matches your profile.
- **Deadline Tracker:** Monitor upcoming closing dates and rolling opportunities.
- **Save & Track:** Bookmark opportunities and organise your application preparation.
- **Student Profile:** Maintain your academic background, technical skills, and interests.

## How Switch Fits In

Switch is the agent coordination layer behind OpportunityBridge.

The planned agent workflow brings together specialised tasks such as:

1. **Opportunity Scout:** Finds relevant student opportunities.
2. **Verification:** Checks opportunity details, eligibility, and source information.
3. **Bridge Coordinator:** Coordinates the workflow and helps organise verified opportunity data.

Mattermost provides a shared collaboration space where agents and the team can communicate and review workflow activity.

The application also uses a transparent rule-based matching engine to evaluate opportunities against student profiles.

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** JSON-based local persistence
- **Agent Coordination:** Switch
- **Agent Collaboration:** Mattermost
- **Version Control:** Git and GitHub

## Project Structure

```text
OpportunityBridge/
├── client/          # React frontend
├── server/          # Backend and API
├── package.json
├── package-lock.json
└── .gitignore
```

## Project Goal

Our goal is to make opportunity discovery simpler, more accessible, and more organised for students by bringing relevant opportunities and application preparation into one platform.

## Current Status

The core web application, student profile, opportunity discovery, matching, saved opportunities, and deadline tracking are implemented. Switch agent coordination and collaborative workflow integration are being developed and tested.

---

**Built for the Flip the Switch Hackathon 2026**

*OpportunityBridge – Bridging students with opportunities.*

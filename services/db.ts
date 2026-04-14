import {
  Role, ClassLevel, SubjectType, Unit, Curriculum,
  ExamTerm, KnowledgeLevel, ItemFormat, CognitiveProcess,
  User, ExamConfiguration, SystemSettings, BlueprintItem,
  QuestionType,
  Blueprint,
  QuestionPaperType,
  Discourse,
  SharedBlueprint
} from '../types';

const API_URL = 'http://localhost:5000/api';

// --- API Implementation ---

export interface DB {
  curriculums: Curriculum[];
  users: User[];
  examConfigs: ExamConfiguration[];
  settings: SystemSettings;
  blueprints: Blueprint[];
  questionPaperTypes: QuestionPaperType[];
  discourses: Discourse[];
  sharedBlueprints: SharedBlueprint[];
}

let cachedDB: DB | null = null;

const getAuthHeaders = () => {
  const token = localStorage.getItem('blueprint_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem('blueprint_token');
    if (typeof window !== 'undefined') {
      // window.location.href = '/login'; // Optional: handled by component redirects
    }
    return null;
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const initDB = async (): Promise<DB> => {
  try {
    const res = await fetch(`${API_URL}/init`);
    const data = await handleResponse(res);
    cachedDB = data;
    return data;
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
};

export const getDB = () => cachedDB;

export const login = async (username: string, password: string): Promise<{ success: boolean, user?: User, error?: string }> => {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || 'Invalid credentials' };
    }
    const { token, user } = await res.json();
    localStorage.setItem('blueprint_token', token);
    return { success: true, user };
  } catch (err) {
    return { success: false, error: 'Server connection failed' };
  }
};

export const logout = () => {
  localStorage.removeItem('blueprint_token');
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const res = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
    return await handleResponse(res) || [];
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes('admin access required')) {
      console.warn('getUsers: restricted access, falling back to cached users');
      const cached = getDB();
      return cached?.users?.filter(user => user.role !== Role.ADMIN) || [];
    }
    console.error('getUsers error:', err);
    return [];
  }
};

export const saveUsers = async (users: User[]): Promise<void> => {
  await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ users })
  }).then(handleResponse);
};

export const getCurriculum = async (cls: ClassLevel, sub: SubjectType): Promise<Curriculum | null> => {
  const res = await fetch(`${API_URL}/curriculums`);
  const list: Curriculum[] = await handleResponse(res) || [];
  return list.find(c => c.classLevel === cls && c.subject === sub) || null;
};

export const getFilteredCurriculum = async (cls?: ClassLevel, sub?: SubjectType): Promise<Curriculum[]> => {
  const res = await fetch(`${API_URL}/curriculums`);
  const list: Curriculum[] = await handleResponse(res) || [];
  return list.filter(c => (!cls || c.classLevel === cls) && (!sub || c.subject === sub));
};

export const saveCurriculum = async (curriculum: Curriculum): Promise<void> => {
  await fetch(`${API_URL}/curriculums`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(curriculum)
  }).then(handleResponse);
};

export const getExamConfigs = async (): Promise<ExamConfiguration[]> => {
  const res = await fetch(`${API_URL}/exam-configs`);
  return await handleResponse(res) || [];
};

export const saveExamConfigs = async (configs: ExamConfiguration[]): Promise<void> => {
  await fetch(`${API_URL}/exam-configs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ configs })
  }).then(handleResponse);
};

export const getSettings = async (): Promise<SystemSettings> => {
  const res = await fetch(`${API_URL}/settings`);
  return await handleResponse(res);
};

export const saveSettings = async (settings: SystemSettings): Promise<void> => {
  await fetch(`${API_URL}/settings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  }).then(handleResponse);
};

export const getBlueprints = async (userId: string): Promise<Blueprint[]> => {
  const res = await fetch(`${API_URL}/blueprints/${userId}`, { headers: getAuthHeaders() });
  return await handleResponse(res) || [];
};

export const saveBlueprint = async (bp: Blueprint): Promise<void> => {
  await fetch(`${API_URL}/blueprints`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(bp)
  }).then(handleResponse);
};

export const deleteBlueprint = async (id: string): Promise<void> => {
  await fetch(`${API_URL}/blueprints/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse);
};

export const toggleBlueprintLock = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/blueprints/all`, { headers: getAuthHeaders() });
  const all: Blueprint[] = await handleResponse(res);
  const bp = all.find(b => b.id === id);
  if (bp) {
    bp.isLocked = !bp.isLocked;
    await saveBlueprint(bp);
  }
};

export const toggleBlueprintHidden = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/blueprints/all`, { headers: getAuthHeaders() });
  const all: Blueprint[] = await handleResponse(res);
  const bp = all.find(b => b.id === id);
  if (bp) {
    bp.isHidden = !bp.isHidden;
    await saveBlueprint(bp);
  }
};

export const resetBlueprintConfirmation = async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/blueprints/all`, { headers: getAuthHeaders() });
    const all: Blueprint[] = await handleResponse(res);
    const bp = all.find(b => b.id === id);
    if (bp) {
      bp.isConfirmed = false;
      await saveBlueprint(bp);
    }
};

export const getQuestionPaperTypes = async (): Promise<QuestionPaperType[]> => {
  const res = await fetch(`${API_URL}/paper-types`);
  return await handleResponse(res) || [];
};

export const saveQuestionPaperTypes = async (types: QuestionPaperType[]): Promise<void> => {
  await fetch(`${API_URL}/paper-types`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ types })
  }).then(handleResponse);
};

export const getDiscourses = async (): Promise<Discourse[]> => {
  const res = await fetch(`${API_URL}/discourses`);
  return await handleResponse(res) || [];
};

export const saveDiscourses = async (discourses: Discourse[]): Promise<void> => {
  await fetch(`${API_URL}/discourses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ discourses })
  }).then(handleResponse);
};

export const shareBlueprint = async (blueprintId: string, fromUserId: string, toUserId: string): Promise<boolean> => {
  const share = {
    id: Math.random().toString(36).substr(2, 9),
    blueprintId,
    ownerId: fromUserId,
    sharedWithUserId: toUserId,
    sharedAt: new Date().toISOString(),
    canEdit: true
  };
  const res = await fetch(`${API_URL}/share`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(share)
  });
  return !!(await handleResponse(res));
};

export const removeShare = async (blueprintId: string, userId: string): Promise<boolean> => {
  const res = await fetch(`${API_URL}/share/${blueprintId}/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return !!(await handleResponse(res));
};

export const getSharedWithUsers = async (blueprintId: string): Promise<User[]> => {
  const res = await fetch(`${API_URL}/share/${blueprintId}`, { headers: getAuthHeaders() });
  return await handleResponse(res) || [];
};

export const getSharedBlueprints = async (userId: string): Promise<Blueprint[]> => {
  const res = await fetch(`${API_URL}/blueprints/${userId}?type=shared`, { headers: getAuthHeaders() });
  return await handleResponse(res) || [];
};

export const getAllAccessibleBlueprints = async (userId: string): Promise<Blueprint[]> => {
  const [owned, shared] = await Promise.all([
    getBlueprints(userId),
    getSharedBlueprints(userId)
  ]);
  const all = [...owned, ...shared];
  return all.filter((bp, index, self) => index === self.findIndex(b => b.id === bp.id));
};

// --- Logic Helpers ---

export const getTermConfiguration = (db: DB, term: ExamTerm, subject: SubjectType, classLevel: ClassLevel) => {
  const config = db.examConfigs.find(c => c.classLevel === classLevel && c.subject === subject && c.term === term);
  if (!config) return [];
  return config.weightages.map(w => ({ u: w.unitNumber, w: w.percentage / 100 }));
};

export const filterCurriculumByTerm = (db: DB, curriculum: Curriculum | null, term: ExamTerm): Curriculum | null => {
  if (!curriculum) return null;
  const weightages = getTermConfiguration(db, term, curriculum.subject, curriculum.classLevel);
  if (weightages.length === 0) return curriculum;

  const activeUnitNumbers = weightages.map(w => w.u);
  return {
    ...curriculum,
    units: curriculum.units.filter(unit => activeUnitNumbers.includes(unit.unitNumber))
  };
};

export const getDefaultFormat = (marks: number): ItemFormat => {
  if (marks === 1) return ItemFormat.SR1;
  if (marks === 2) return ItemFormat.CRS1;
  if (marks === 3) return ItemFormat.CRS2;
  if (marks === 4) return ItemFormat.CRS3;
  if (marks >= 5) return ItemFormat.CRL;
  return ItemFormat.CRS1;
};

export const getDefaultKnowledge = (marks: number): KnowledgeLevel => {
  if (marks === 1) return KnowledgeLevel.BASIC;
  if (marks === 2) return KnowledgeLevel.AVERAGE;
  return KnowledgeLevel.PROFOUND;
};

const shuffle = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const partitionTokensToUnits = (
  tokens: { mark: number, sectionId: string }[],
  unitTargets: { unit: Unit, target: number }[]
): { unit: Unit, tokens: { mark: number, sectionId: string }[] }[] | null => {
  const solve = (tokenIdx: number, deficits: number[]): { mark: number, sectionId: string }[][] | null => {
    if (tokenIdx === tokens.length) {
      return deficits.every(d => Math.abs(d) < 0.1) ? deficits.map(() => []) : null;
    }
    const token = tokens[tokenIdx];
    const unitIndices = shuffle(Array.from({ length: deficits.length }, (_, i) => i));
    for (const uIdx of unitIndices) {
      if (deficits[uIdx] >= token.mark - 0.1) {
        deficits[uIdx] -= token.mark;
        const result = solve(tokenIdx + 1, deficits);
        if (result) {
          result[uIdx].push(token);
          return result;
        }
        deficits[uIdx] += token.mark;
      }
    }
    return null;
  };
  const initialDeficits = unitTargets.map(ut => ut.target);
  const allocation = solve(0, initialDeficits);
  if (!allocation) return null;
  return unitTargets.map((ut, i) => ({ unit: ut.unit, tokens: allocation[i] }));
};

const assignKnowledgeLevels = (items: BlueprintItem[], targets: Record<KnowledgeLevel, number>): boolean => {
  const klOrder = [KnowledgeLevel.BASIC, KnowledgeLevel.AVERAGE, KnowledgeLevel.PROFOUND];
  const solve = (idx: number, currentDeficits: Record<string, number>): boolean => {
    if (idx === items.length) return Object.values(currentDeficits).every(d => Math.abs(d) < 0.1);
    const item = items[idx];
    const options = shuffle(klOrder);
    for (const kl of options) {
      if (currentDeficits[kl] >= item.totalMarks - 0.1) {
        currentDeficits[kl] -= item.totalMarks;
        item.knowledgeLevel = kl;
        if (item.hasInternalChoice) item.knowledgeLevelB = kl;
        if (solve(idx + 1, currentDeficits)) return true;
        currentDeficits[kl] += item.totalMarks;
      }
    }
    return false;
  };
  return solve(0, { ...targets });
};

export const generateBlueprintTemplate = (
  db: DB,
  curriculum: Curriculum,
  term: ExamTerm,
  paperTypeId: string
): BlueprintItem[] => {
  const paperType = db.questionPaperTypes.find((p: any) => p.id === paperTypeId);
  if (!paperType) return [];

  const weightages = getTermConfiguration(db, term, curriculum.subject, curriculum.classLevel);
  const activeUnitNumbers = weightages.map(w => w.u);
  const filteredUnits = weightages.length > 0
    ? curriculum.units.filter(u => activeUnitNumbers.includes(u.unitNumber))
    : curriculum.units;

  if (filteredUnits.length === 0) return [];

  const unitTargets: { unit: Unit, target: number }[] = [];
  const activeWeightages = weightages.length > 0 ? weightages : filteredUnits.map(u => ({ u: u.unitNumber, w: 1 / filteredUnits.length }));

  activeWeightages.forEach(w => {
    const unit = filteredUnits.find(u => u.unitNumber === w.u);
    if (unit) unitTargets.push({ unit, target: paperType.totalMarks * w.w });
  });

  const tokenPool: { mark: number, sectionId: string }[] = [];
  paperType.sections.forEach(section => {
    for (let i = 0; i < section.count; i++) tokenPool.push({ mark: section.marks, sectionId: section.id });
  });

  let unitAllocation = partitionTokensToUnits(tokenPool, unitTargets);
  if (!unitAllocation) {
    const deficits = unitTargets.map(ut => ut.target);
    const allocation: { mark: number, sectionId: string }[][] = unitTargets.map(() => []);
    shuffle(tokenPool).forEach(token => {
      let maxDeficitIdx = 0;
      for (let i = 1; i < deficits.length; i++) if (deficits[i] > deficits[maxDeficitIdx]) maxDeficitIdx = i;
      allocation[maxDeficitIdx].push(token);
      deficits[maxDeficitIdx] -= token.mark;
    });
    unitAllocation = unitTargets.map((ut, i) => ({ unit: ut.unit, tokens: allocation[i] }));
  }

  const items: BlueprintItem[] = [];
  const usageTracker: Record<string, number> = {};

  unitAllocation.forEach(alloc => {
    alloc.tokens.forEach(token => {
      if (!usageTracker[alloc.unit.id]) usageTracker[alloc.unit.id] = 0;
      const subUnitId = alloc.unit.subUnits.length > 0
        ? alloc.unit.subUnits[usageTracker[alloc.unit.id] % alloc.unit.subUnits.length].id
        : 'general';
      usageTracker[alloc.unit.id]++;

      const section = paperType.sections.find(s => s.id === token.sectionId);
      const hasInternalChoice = items.filter(i => i.sectionId === token.sectionId && i.hasInternalChoice).length < (section?.optionCount || 0);

      items.push({
        id: Math.random().toString(36).substr(2, 9),
        unitId: alloc.unit.id,
        subUnitId: subUnitId,
        marksPerQuestion: token.mark,
        totalMarks: token.mark,
        questionCount: 1,
        sectionId: token.sectionId,
        knowledgeLevel: KnowledgeLevel.BASIC,
        cognitiveProcess: CognitiveProcess.CP2,
        itemFormat: getDefaultFormat(token.mark),
        questionType: token.mark === 1 ? QuestionType.SR1 : token.mark === 2 ? QuestionType.CRS1 : token.mark === 3 ? QuestionType.CRS2 : token.mark === 4 ? QuestionType.CRS3 : QuestionType.CRL,
        hasInternalChoice: hasInternalChoice,
        knowledgeLevelB: KnowledgeLevel.BASIC,
        cognitiveProcessB: CognitiveProcess.CP2,
        itemFormatB: getDefaultFormat(token.mark),
        questionText: '',
        answerText: ''
      });
    });
  });

  // Assign Knowledge Levels
  const klTargets = {
    [KnowledgeLevel.BASIC]: Math.round(paperType.totalMarks * 0.3),
    [KnowledgeLevel.AVERAGE]: Math.round(paperType.totalMarks * 0.5),
    [KnowledgeLevel.PROFOUND]: paperType.totalMarks - Math.round(paperType.totalMarks * 0.3) - Math.round(paperType.totalMarks * 0.5)
  };
  assignKnowledgeLevels(items, klTargets);

  return items;
};

-- Strip the 'uploads/' prefix from stored file paths
-- Old format: 'uploads/cvs/xxx.pdf' → New format: 'cvs/xxx.pdf'
-- Old format: 'uploads/lettres/xxx.pdf' → New format: 'lettres/xxx.pdf'

UPDATE candidature
SET path_cv = SUBSTRING(path_cv FROM 9)
WHERE path_cv LIKE 'uploads/%';

UPDATE candidature
SET path_lettre_motivation = SUBSTRING(path_lettre_motivation FROM 9)
WHERE path_lettre_motivation LIKE 'uploads/%';

UPDATE candidature
SET path_cv2 = SUBSTRING(path_cv2 FROM 9)
WHERE path_cv2 LIKE 'uploads/%';

UPDATE candidature
SET path_lettre_motivation2 = SUBSTRING(path_lettre_motivation2 FROM 9)
WHERE path_lettre_motivation2 LIKE 'uploads/%';

-- Füge neue Spalten für die richtigen Datumsangaben hinzu
ALTER TABLE person
    ADD COLUMN Birthdate DATE NOT NULL AFTER F13;
ALTER TABLE person
    ADD COLUMN Deathdate DATE NOT NULL AFTER F14;

-- Übersetze die Monate auf Englisch
UPDATE person
    SET F13 = REPLACE(REPLACE(REPLACE(REPLACE(F13,'Dez', 'Dec'),'Okt', 'Oct'), 'Mai', 'May'), 'Mär', 'Mar');
UPDATE person
    SET F14 = REPLACE(REPLACE(REPLACE(REPLACE(F14,'Dez', 'Dec'),'Okt', 'Oct'), 'Mai', 'May'), 'Mär', 'Mar');

-- Umwandlung des ersten Formates
UPDATE IGNORE person
    SET Birthdate = STR_TO_DATE(F13, '%Y~');
UPDATE IGNORE person
    SET Deathdate = STR_TO_DATE(F14, '%Y~');


-- Umwandlung des zweiten Formates
UPDATE IGNORE person
    SET Birthdate =	STR_TO_DATE(F13, '%Y %b %d')
    WHERE Birthdate = '00-00-0000';
UPDATE IGNORE person
    SET Deathdate =	STR_TO_DATE(F14, '%Y %b %d')
    WHERE Deathdate = '00-00-0000';
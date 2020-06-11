# Tabelle für Protestbewegungen
CREATE TABLE IF NOT EXISTS movement (
                          id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
                          name VARCHAR(100) NOT NULL UNIQUE,
                          startYear SMALLINT,
                          endYear SMALLINT
);

# Tabelle für Orte
CREATE TABLE IF NOT EXISTS `place` (
                         id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
                         name varchar(100) NOT NULL UNIQUE,
                         latitude varchar(32) NOT NULL,
                         longitude varchar(32) NOT NULL
);

# Verknüpfungstabelle Protestbewegungen-Orte
CREATE TABLE IF NOT EXISTS movementPlace (
                               movementID SMALLINT UNSIGNED NOT NULL,
                               placeID SMALLINT UNSIGNED NOT NULL,
                               CONSTRAINT FK_MV_PLACES
                                   FOREIGN KEY (movementID) REFERENCES movement (id),
                                   FOREIGN KEY (placeID) REFERENCES place (id),
                                   PRIMARY KEY (movementID, placeID)
);

# Beispieldaten eingeben
INSERT INTO place (name, latitude, longitude) VALUES
    ('München', 48.1551, 11.5418);

INSERT INTO place (name, latitude, longitude) VALUES
    ('Kolbermoor', 47.8516, 12.0644);

INSERT INTO movement (name, startYear, endYear) VALUES
    ('Black Lives Matter MUC', 2020, Null);

INSERT INTO movement SET
    name = 'Münchner Räterpublik',
    startYear = 1919,
    endYear = 1919 ON DUPLICATE KEY UPDATE
    name = 'Münchner Räterpublik',
    startYear = 1919,
    endYear = 1919;

INSERT INTO movement SET
    name = 'Kolbermoorer Räterpublik',
     startYear = 1919,
     endYear = 1919 ON DUPLICATE KEY UPDATE
     name = 'Kolbermoorer Räterpublik',
     startYear = 1919,
     endYear = 1919;


INSERT INTO movementPlace (movementID, placeID) VALUES
    (1, 1);

INSERT INTO movementPlace (movementID, placeID) VALUES
    (2, 1);

INSERT INTO movementPlace (movementID, placeID) VALUES
    (3, 2);

# Beispielhafter Join, um alle Protestbewegungen mit dazugehörigen Orten zu laden

SELECT p.id,p.name,p.latitude,p.longitude,m.id,m.name,m.startYear,m.endYear
FROM movementPlace mp
         INNER JOIN place p ON mp.placeID = p.id
         INNER JOIN movement m ON mp.movementID = m.id
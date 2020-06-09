# Tabelle für Protestbewegungen
CREATE TABLE IF NOT EXISTS movement (
                          id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
                          name VARCHAR(100) NOT NULL UNIQUE,
                          startYear SMALLINT,
                          endYear SMALLINT
);

# Tabelle für Orte
CREATE TABLE IF NOT EXISTS `place` (
                         `ID` SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
                         `Name` varchar(100) NOT NULL UNIQUE,
                         `Latitude` varchar(32) NOT NULL,
                         `Longitude` varchar(32) NOT NULL
);

# Verknüpfungstabelle Protestbewegungen-Orte
CREATE TABLE IF NOT EXISTS movementPlace (
                               movementID SMALLINT UNSIGNED NOT NULL,
                               placeID SMALLINT UNSIGNED NOT NULL,
                               CONSTRAINT FK_MV_PLACES
                                   FOREIGN KEY (movementID) REFERENCES movement (id),
                                   FOREIGN KEY (placeID) REFERENCES place (ID),
                                   PRIMARY KEY (movementID, placeID)
);

# Beispieldaten eingeben
INSERT INTO place (Name, Latitude, Longitude) VALUES
    ('München', 48.1551, 11.5418);

INSERT INTO movement (name, startYear, endYear) VALUES
    ('Black Lives Matter MUC', 2020, Null);

INSERT INTO movementPlace (movementID, placeID) VALUES
    (1, 1);

# Beispielhafter Join, um alle Protestbewegungen mit dazugehörigen Orten zu laden

SELECT p.ID, p.Name, p.Latitude, p.Longitude, m.id, m.name, m.startYear, m.endYear
FROM movementPlace mp
         INNER JOIN place p ON mp.placeID = p.ID
         INNER JOIN movement m ON mp.movementID = m.id
# Tabelle für Protestbewegungen
CREATE TABLE IF NOT EXISTS movement (
                          id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
                          name VARCHAR(100) NOT NULL UNIQUE,
                          description VARCHAR(10000),
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

CREATE TABLE IF NOT EXISTS movementLink (
                                             movementID SMALLINT UNSIGNED NOT NULL,
                                             link VARCHAR(2000) NOT NULL,
                                             INDEX (movementID),
                                             CONSTRAINT FK_MV_LINKS
                                                 FOREIGN KEY (movementID) REFERENCES movement (id),
                                             CONSTRAINT UNIQUE_KEY
                                                 UNIQUE KEY (movementID, link(255))
#         Gibt im Moment folgenden Fehler, deswegen deaktiviert: Specified key was too long; max key length is 3072
#         bytes
#         PRIMARY KEY (movementID, links)
);

# Tabelle für Protestbewegungen to confirm
CREATE TABLE IF NOT EXISTS movementUnconfirmed (
                                                   id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
                                                   name VARCHAR(100) NOT NULL UNIQUE,
                                                   description VARCHAR(10000),
                                                   startYear SMALLINT,
                                                   endYear SMALLINT
);

# Tabelle für Orte
CREATE TABLE IF NOT EXISTS `placeUnconfirmed` (
                                                  id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
                                                  name varchar(100) NOT NULL UNIQUE,
                                                  latitude varchar(32) NOT NULL,
                                                  longitude varchar(32) NOT NULL
);

# Verknüpfungstabelle Protestbewegungen-Orte
CREATE TABLE IF NOT EXISTS movementPlaceUnconfirmed (
                                                        movementID SMALLINT UNSIGNED NOT NULL,
                                                        placeID SMALLINT UNSIGNED NOT NULL,
                                                        CONSTRAINT FK_MV_PLACES_UNCONFIRMED
                                                            FOREIGN KEY (movementID) REFERENCES movementUnconfirmed (id),
                                                        FOREIGN KEY (placeID) REFERENCES placeUnconfirmed (id),
                                                        PRIMARY KEY (movementID, placeID)
);

CREATE TABLE IF NOT EXISTS movementLinkUnconfirmed (
                                                       movementID SMALLINT UNSIGNED NOT NULL,
                                                       link VARCHAR(2000) NOT NULL,
                                                       INDEX (movementID),
                                                       CONSTRAINT FK_MV_LINKS_UNCONFIRMED
                                                           FOREIGN KEY (movementID) REFERENCES movementUnconfirmed (id),
                                                       CONSTRAINT UNIQUE_KEY_UNCONFIRMED
                                                           UNIQUE KEY (movementID, link(255))
#         Gibt im Moment folgenden Fehler, deswegen deaktiviert: Specified key was too long; max key length is 3072
#         bytes
#         PRIMARY KEY (movementID, links)
);

# Beispieldaten einfügen

INSERT INTO place (name, latitude, longitude) VALUES
    ('München', 48.1551, 11.5418)
    ON DUPLICATE KEY UPDATE
    name = 'München',
    latitude = 48.1551,
    longitude = 11.5418;

INSERT INTO place (name, latitude, longitude) VALUES
    ('Kolbermoor', 47.8516, 12.0644)
    ON DUPLICATE KEY UPDATE
    name = 'Kolbermoor',
    latitude = 47.8516,
    longitude = 12.0644;

INSERT INTO movement (name) VALUES
    ('Black Lives Matter MUC')
    ON DUPLICATE KEY UPDATE
    name = 'Black Lives Matter MUC';

INSERT INTO movement SET
    name = 'Münchner Räterepublik',
    startYear = 1919,
    endYear = 1919 ON DUPLICATE KEY UPDATE
    name = 'Münchner Räterepublik',
    startYear = 1919,
    endYear = 1919;

INSERT INTO movement SET
    name = 'Kolbermoorer Räterepublik',
    startYear = 1919,
    endYear = 1919,
    description = 'Die "Räterepublik Baiern" markiert die letzte Phase der Revolution 1918/1919 und den Versuch, in Bayern ein neues Gemeinwesen zu etablieren: Hauptziele waren die Machtübernahme durch die Arbeiterparteien, der Anschluss an die Weltrevolution sowie die Vergesellschaftung der Wirtschaft. Im April 1919 gelang es Linkssozialisten und Kommunisten mit diesem Programm, die gewählte Staatsregierung aus München und Teilen Südbayerns zu verdrängen und sich dort für wenige Tage oder Wochen als faktische Inhaber der öffentlichen Gewalt zu behaupten. Die Räteherrschaft setzte sich also nicht landesweit, sondern nur in einigen urbanen und industriellen Zentren kurz durch. In München und Rosenheim zerfällt die Zeit außerdem in eine sozialistische und eine radikalere kommunistische Phase, die schließlich in die "Diktatur der Roten Armee" mündete. Die nach Bamberg ausgewichene Staatsregierung konnte ihre Autorität schließlich nur unter Zuhilfenahme von Reichstruppen und Freikorps im ganzen Land wiederherstellen und die Rote Armee der Räterepublik Ende April 1919 in einem kurzen Bürgerkrieg militärisch besiegen.'
    ON DUPLICATE KEY UPDATE
    name = 'Kolbermoorer Räterepublik',
    startYear = 1919,
    endYear = 1919,
    description = 'Die "Räterepublik Baiern" markiert die letzte Phase der Revolution 1918/1919 und den Versuch, in Bayern ein neues Gemeinwesen zu etablieren: Hauptziele waren die Machtübernahme durch die Arbeiterparteien, der Anschluss an die Weltrevolution sowie die Vergesellschaftung der Wirtschaft. Im April 1919 gelang es Linkssozialisten und Kommunisten mit diesem Programm, die gewählte Staatsregierung aus München und Teilen Südbayerns zu verdrängen und sich dort für wenige Tage oder Wochen als faktische Inhaber der öffentlichen Gewalt zu behaupten. Die Räteherrschaft setzte sich also nicht landesweit, sondern nur in einigen urbanen und industriellen Zentren kurz durch. In München und Rosenheim zerfällt die Zeit außerdem in eine sozialistische und eine radikalere kommunistische Phase, die schließlich in die "Diktatur der Roten Armee" mündete. Die nach Bamberg ausgewichene Staatsregierung konnte ihre Autorität schließlich nur unter Zuhilfenahme von Reichstruppen und Freikorps im ganzen Land wiederherstellen und die Rote Armee der Räterepublik Ende April 1919 in einem kurzen Bürgerkrieg militärisch besiegen.';

INSERT INTO movementPlace (movementID, placeID) VALUES
    (1, 1)
    ON DUPLICATE KEY UPDATE
    movementID = 1,
    placeID = 1;

INSERT INTO movementPlace (movementID, placeID) VALUES
    (2, 1)
    ON DUPLICATE KEY UPDATE
    movementID = 2,
    placeID = 1;

INSERT INTO movementPlace (movementID, placeID) VALUES
    (3, 2)
    ON DUPLICATE KEY UPDATE
    movementID = 3,
    placeID = 2;

INSERT INTO movementLink SET
    movementID = 3,
    link = 'https://www.historisches-lexikon-bayerns.de/Lexikon/Räterepublik_Baiern_(1919)'
    ON DUPLICATE KEY UPDATE
    movementID = 3,
    link = 'https://www.historisches-lexikon-bayerns.de/Lexikon/Räterepublik_Baiern_(1919)';

INSERT INTO movementUnconfirmed SET
    name = 'Test',
    description = 'Ich bin eine Beschreibung',
    startYear = 2020
    ON DUPLICATE KEY UPDATE
    name = 'Test',
    description = 'Ich bin eine Beschreibung',
    startYear = 2020;

INSERT INTO placeUnconfirmed SET
    name = 'München',
    latitude = 48.15,
    longitude = 11.54
    ON DUPLICATE KEY UPDATE
    name = 'München',
    latitude = 48.15,
    longitude = 11.54;

INSERT INTO movementPlaceUnconfirmed SET
    movementID = 1,
    placeID = 1
    ON DUPLICATE KEY UPDATE
    movementID = 1,
    placeID = 1;

INSERT INTO movementLinkUnconfirmed SET
    movementID = 1,
    link = 'https://www.anarchismus.at/geschichte-des-anarchismus/deutschland/615-kolbermoorer-raeterepublik'
    ON DUPLICATE KEY UPDATE
    movementID = 1,
    link = 'https://www.anarchismus.at/geschichte-des-anarchismus/deutschland/615-kolbermoorer-raeterepublik'

# Beispielhafter Join, um alle Protestbewegungen mit dazugehörigen Orten zu laden

/*SELECT p.id,p.name,p.latitude,p.longitude,m.id,m.name,m.startYear,m.endYear
FROM movementPlace mp
         INNER JOIN place p ON mp.placeID = p.id
         INNER JOIN movement m ON mp.movementID = m.id*/
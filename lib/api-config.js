export default {
  "resources": [
    {
      "type": "fabio:PressRelease",
      "properties": [
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "http://mu.semte.ch/vocabularies/core/uuid",
        "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#title",
        "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#htmlContent",
        "http://purl.org/dc/terms/abstract",
        "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#keyword",
        "http://purl.org/dc/terms/created",
        "http://purl.org/dc/terms/modified",
        "http://www.w3.org/ns/dcat#theme",
        "http://purl.org/dc/terms/source",
        "http://purl.org/dc/terms/creator",
        "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#hasPart",
        "https://data.vlaanderen.be/ns/besluitvorming#beleidsveld",
        "http://mu.semte.ch/vocabularies/ext/used",
        "http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#isScheduledOn"
      ]
    },
    {
      "type": "nfo:FileDataObject",
      "path": "nie:hasPart / ^nie:dataSource*",
      "properties": [
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "http://mu.semte.ch/vocabularies/core/uuid",
        "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileName",
        "http://purl.org/dc/terms/format",
        "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileSize",
        "http://dbpedia.org/ontology/fileExtension",
        "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#fileCreated",
        "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#dataSource"
      ]
    },
    {
      "type": "ebucore:Contact",
      "path": "dct:source",
      "properties": [
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "http://mu.semte.ch/vocabularies/core/uuid",
        "http://www.w3.org/2006/vcard/ns#fn",
        "http://www.w3.org/2006/vcard/ns#given-name",
        "http://www.w3.org/2006/vcard/ns#family-name",
        "http://www.w3.org/2006/vcard/ns#role",
        "http://purl.org/dc/terms/created",
        "http://purl.org/dc/terms/modified",
        "http://www.w3.org/ns/adms#status",
        "http://www.w3.org/2006/vcard/ns#hasEmail",
        "http://www.w3.org/2006/vcard/ns#hasTelephone",
        "http://mu.semte.ch/vocabularies/ext/hasMobile",
        "http://purl.org/dc/terms/creator",
        "^http://www.w3.org/ns/org#hasMember"
      ]
    },
    {
      "type": "vcard:Email",
      "path": "dct:source / vcard:hasEmail",
      "properties": [
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "http://mu.semte.ch/vocabularies/core/uuid",
        "http://www.w3.org/2006/vcard/ns#hasValue",
        "http://purl.org/dc/terms/creator"
      ]
    },
    {
      "type": "vcard:Voice",
      "path": "dct:source / vcard:hasTelephone",
      "properties": [
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "http://mu.semte.ch/vocabularies/core/uuid",
        "http://www.w3.org/2006/vcard/ns#hasValue",
        "http://purl.org/dc/terms/creator"
      ]
    },
    {
      "type": "vcard:Cell",
      "path": "dct:source / ext:hasMobile",
      "properties": [
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "http://mu.semte.ch/vocabularies/core/uuid",
        "http://www.w3.org/2006/vcard/ns#hasValue",
        "http://purl.org/dc/terms/creator"
      ]
    },
    {
      "type": "ebucore:PublicationEvent",
      "path": "ebucore:isScheduledOn",
      "properties": [
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
        "http://mu.semte.ch/vocabularies/core/uuid",
        "http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#publishedStartDateTime"
      ]
    }
  ]
};

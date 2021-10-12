import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';
import { sparqlEscapeUri, sparqlEscapeString } from 'mu';
import { PUBLISHED_GRAPH, WEBSITE_FLANDERS_BE_PUBLICATION_CHANNEL } from '../config';
import RESOURCE_CONFIG from './api-config.json';

const PREFIXES = `
    PREFIX mu: ${sparqlEscapeUri('http://mu.semte.ch/vocabularies/core/')}
    PREFIX ext: ${sparqlEscapeUri('http://mu.semte.ch/vocabularies/ext/')}
    PREFIX ebucore: ${sparqlEscapeUri('http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#')}
    PREFIX prov: ${sparqlEscapeUri('http://www.w3.org/ns/prov#')}
    PREFIX vcard: ${sparqlEscapeUri('http://www.w3.org/2006/vcard/ns#')}
    PREFIX foaf: ${sparqlEscapeUri('http://xmlns.com/foaf/0.1/')}
    PREFIX fabio: ${sparqlEscapeUri('http://purl.org/spar/fabio/')}
    PREFIX session: ${sparqlEscapeUri('http://mu.semte.ch/vocabularies/session/')}
    PREFIX nmo: ${sparqlEscapeUri('http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#')}
    PREFIX nie: ${sparqlEscapeUri('http://www.semanticdesktop.org/ontologies/2007/01/19/nie#')}
    PREFIX nfo: ${sparqlEscapeUri('http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#')}
    PREFIX dct: ${sparqlEscapeUri('http://purl.org/dc/terms/')}
    PREFIX dbpedia: ${sparqlEscapeUri('http://purl.org/dc/terms/')}
    PREFIX skos: ${sparqlEscapeUri('http://www.w3.org/2004/02/skos/core#')}
    PREFIX adms: ${sparqlEscapeUri('http://www.w3.org/ns/adms#')}
    PREFIX org: ${sparqlEscapeUri('http://www.w3.org/ns/org#')}
`;

export async function copyPressReleases(pressReleaseUri, graph) {
  let resources = RESOURCE_CONFIG.resources;

  for (const resourceConfig of resources) {
    const deleteProperties = await getProperties(pressReleaseUri, resourceConfig, PUBLISHED_GRAPH);
    if (deleteProperties.length) {
        const statements = toTripleStatements(deleteProperties);

        // delete existing resources from target graph
        await update(`
        ${PREFIXES}
        DELETE DATA {
            GRAPH ${sparqlEscapeUri(PUBLISHED_GRAPH)}{
               ${statements}
            }
        }
        `);
      }

      const isContactResource = ["vcard:Email", "vcard:Voice", "vcard:Cell"].includes(resourceConfig.type);
      console.log("source: ", resourceConfig.type, isContactResource)
      const additionalFilter = isContactResource ? `?subject ext:publicationChannel <${WEBSITE_FLANDERS_BE_PUBLICATION_CHANNEL}> .` : ''

      const insertProperties = await getProperties(pressReleaseUri, resourceConfig, graph, additionalFilter);
      if (insertProperties.length) {
        const statements = toTripleStatements(insertProperties);

        // insert new resources into target graph
        await update(`
        ${PREFIXES}
        INSERT DATA {
            GRAPH ${sparqlEscapeUri(PUBLISHED_GRAPH)}{
               ${statements}
            }
        }
        `);
      }
    }
  }

async function getProperties(pressReleaseUri, resourceConfig, graph, additionalFilter) {
  let properties = [];



  // Direct properties
  const directProperties = resourceConfig.properties.filter(p => !isInverse(p));
  if (directProperties.length) {
      let pathToPressRelease;
      if (resourceConfig.path) {
          pathToPressRelease = `${sparqlEscapeUri(pressReleaseUri)} ${resourceConfig.path} ?subject .`;
      } else {
          pathToPressRelease = `BIND(${sparqlEscapeUri(pressReleaseUri)} as ?subject)`;
      }
      const values = directProperties.map((i) => sparqlEscapeUri(i)).join('\n');

      const result = await query(`
          ${PREFIXES}
          SELECT ?subject ?predicate ?object
          WHERE {
            GRAPH <${graph}> {
              ${sparqlEscapeUri(pressReleaseUri)} a fabio:PressRelease.
              ${pathToPressRelease}
              ?subject ?predicate ?object .
              ${additionalFilter ? additionalFilter : ''}
              VALUES ?predicate {
                ${values}
              }
            }
         }`);
      properties = properties.concat(result.results.bindings);
    }

  // Inverse properties
  const inverseProperties = resourceConfig.properties.filter(p => isInverse(p));
  if (inverseProperties.length) {
      let pathToPressRelease;
      if (resourceConfig.path) {
          pathToPressRelease = `${sparqlEscapeUri(pressReleaseUri)} ${resourceConfig.path} ?object .`;
      } else {
          pathToPressRelease = `BIND(${sparqlEscapeUri(pressReleaseUri)} as ?object)`;
      }
      const values = inverseProperties.map((i) => {
          const predicate = normalizePredicate(i);
          return sparqlEscapeUri(predicate);
      }).join('\n');

      const result = await query(`
          ${PREFIXES}
          SELECT ?subject ?predicate ?object
          WHERE {
            GRAPH <${graph}> {
              ${sparqlEscapeUri(pressReleaseUri)} a fabio:PressRelease.
              ${pathToPressRelease}
              ?subject ?predicate ?object .
              VALUES ?predicate {
                 ${values}
              }
            }
         }`);
      properties = properties.concat(result.results.bindings);
  }

  return properties;
}


function toTripleStatements(triples) {
    const escape = function (rdfTerm) {
      const { type, value, datatype, "xml:lang": lang } = rdfTerm;
      if (type == "uri") {
        return sparqlEscapeUri(value);
      } else if (type == "literal" || type == "typed-literal") {
        // We ignore xsd:string datatypes because Virtuoso doesn't treat those as default datatype
        // Eg. SELECT * WHERE { ?s mu:uuid "4983948" } will not return any value if the uuid is a typed literal
        // Since the n3 npm library used by the producer explicitely adds xsd:string on non-typed literals
        // we ignore the xsd:string on ingest
        if (datatype && datatype != 'http://www.w3.org/2001/XMLSchema#string')
          return `${sparqlEscapeString(value)}^^${sparqlEscapeUri(datatype)}`;
        else if (lang)
          return `${sparqlEscapeString(value)}@${lang}`;
        else
          return `${sparqlEscapeString(value)}`;
      } else
        console.log(`Don't know how to escape type ${type}. Will escape as a string.`);
      return sparqlEscapeString(value);
    };

    return triples.map(function(t) {
        const subject = escape(t.subject);
        const predicate = escape(t.predicate);
        const object = escape(t.object);
        return `${subject} ${predicate} ${object} . `;
    }).join('\n');
}

function toInsertQuery(statementsString, graph) {
    return `
    ${PREFIXES}
    INSERT DATA {
        GRAPH ${sparqlEscapeUri(graph)}{
           ${statementsString}
        }
    }
    `;
}

function toDeleteQuery(statementsString, graph) {
    return `
    ${PREFIXES}
    DELETE DATA {
        GRAPH ${sparqlEscapeUri(graph)}{
           ${statementsString}
        }
    }
    `;
}

function isInverse(predicate) {
    return predicate && predicate.startsWith('^');
}

function normalizePredicate(predicate) {
    return isInverse(predicate) ? predicate.slice(1) : predicate;
}
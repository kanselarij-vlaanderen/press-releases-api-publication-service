import { querySudo as query, updateSudo as update } from '@lblod/mu-auth-sudo';
import { sparqlEscapeDateTime } from 'mu';
import { API_PUBLICATION_CHANNEL } from '../config';
import { copyPressReleases } from '../lib/graph-helper';

const TASK_NOT_STARTED_STATUS = 'http://themis.vlaanderen.be/id/concept/publication-task-status/not-started';
const TASK_ONGOING_STATUS = 'http://themis.vlaanderen.be/id/concept/publication-task-status/ongoing';
const TASK_SUCCESS_STATUS = 'http://themis.vlaanderen.be/id/concept/publication-task-status/success';
const TASK_FAILED_STATUS = 'http://themis.vlaanderen.be/id/concept/publication-task-status/failed';


class PublicationTask {
  constructor({ uri, graph, pressRelease, status, publicationDate }) {
    /** Uri of the publication task */
    this.uri = uri;

    /** Graph where the publication tasks is stored */
    this.graph = graph;

    /**
     * The fabio:PressRelease object linked to this publication task
    */
    this.pressRelease = pressRelease;

    /**
     * Current status of the publication task as stored in the triplestore
    */
    this.status = status;

    /**
     * The publication date of the publication event
     */
    this.publicationDate = publicationDate;
  }

  /**
   * Persists the given status as task status in the triple store
   *
   * @param status {string} URI of the task status
   * @public
  */
  async persistStatus(status) {
    this.status = status;

    await update(`
      PREFIX adms: <http://www.w3.org/ns/adms#>
      PREFIX dct: <http://purl.org/dc/terms/>

      DELETE WHERE {
        GRAPH <${this.graph}> {
          <${this.uri}> adms:status ?status .
          <${this.uri}> dct:modified ?modified .
        }
      }
    `);

    await update(`
      PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
      PREFIX adms: <http://www.w3.org/ns/adms#>
      PREFIX dct: <http://purl.org/dc/terms/>

      INSERT {
        GRAPH <${this.graph}> {
          <${this.uri}> adms:status <${this.status}> ;
            dct:modified ${sparqlEscapeDateTime(new Date())} .
        }
      } WHERE {
        GRAPH <${this.graph}> {
          <${this.uri}> a ext:PublicationTask .
        }
      }
    `);
  }

  /**
   * Processes the publication task
   *
   * @public
  */
  async process() {
    try {
      console.log(`Processing publication task <${this.uri}>...`);
      await this.publish();
      await this.persistStatus(TASK_SUCCESS_STATUS);
      console.log(`Processing publication task <${this.uri}> done.`);
    } catch (e) {
      await this.closeWithFailure();
      console.log(`Something went wrong while processing the publication task.`);
      console.log(e);
    }
  }

  /**
   * Copy the press releases to the published graph
   */
  async publish() {
    await copyPressReleases(this.uri, this.graph);
  }

  /**
  * Close the publication task with a failure status
  *
  * @private
 */
  async closeWithFailure() {
    await this.persistStatus(TASK_FAILED_STATUS);
  }
}

/**
 * Get all publication tasks that are not yet started or published,
 * and are linked to the API publication channel.
 *
 * @public
*/
async function getNotStartedPublicationTasks() {
  const result = await query(`
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX adms: <http://www.w3.org/ns/adms#>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX prov: <http://www.w3.org/ns/prov#>
    PREFIX ebucore: <http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#>

    SELECT ?publicationTask ?graph ?pressRelease ?publicationDate WHERE {
      GRAPH ?graph {
        ?publicationTask a ext:PublicationTask ;
          adms:status <${TASK_NOT_STARTED_STATUS}> ;
          ext:publicationChannel <${API_PUBLICATION_CHANNEL}> ;
          dct:created ?created .
        ?event a ebucore:PublicationEvent ;
          prov:generated ?publicationTask ;
          ebucore:publicationStartDateTime ?publicationDate .
        ?pressRelease ebucore:isScheduledOn ?event .
        FILTER NOT EXISTS { ?publicationEvent  ebucore:publicationEndDateTime ?endTime . }
      }
    } ORDER BY ?created
  `);

  if (result.results.bindings.length) {
    const bindings = result.results.bindings;

    return bindings.map(b => new PublicationTask({
      uri: b['publicationTask'].value,
      graph: b['graph'].value,
      pressRelease: b['pressRelease'].value,
      status: TASK_NOT_STARTED_STATUS,
      publicationDate: new Date(Date.parse(b['publicationDate'].value))
    }));
  } else {
    return null;
  }
}

export default PublicationTask;

export {
  getNotStartedPublicationTasks,
  TASK_ONGOING_STATUS
};

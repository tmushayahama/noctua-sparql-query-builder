import { map } from 'lodash';
import {
    Clause,
    Graph,
    Optional,
    optional,
    Prefix,
    prefix,
    Triple,
    Query,
    triple,
    Where,

} from "sparql-query-builder/dist";

export class NoctuaQuery extends Query {

    private _where = new Where();
    private _graph = new Graph('?model');

    constructor() {
        super();
        this._addPrefix();
        this._addTemplate();
    }

    goterm(goTermId: string) {
        this._graph.addComponent(`FILTER(?term = ${goTermId})`);
        return this;
    }

    pmid(pmid: string) {
        this._graph.addComponent(triple('?entity', 'dc:source', '?source'));
        this._graph.addComponent('BIND(REPLACE(?source, " ", "") AS ?source)');
        this._graph.addComponent(`FILTER((CONTAINS(?source, "${pmid}")))`);
    }

    contributor(orcid: string) {
        this._where.addComponent(`BIND(${orcid} as ?orcid)`);
        this._where.addComponent('BIND(IRI(?orcid) as ?orcidIRI)');
        this._where.addComponent(optional(
            triple('?orcidIRI', 'rdfs:label', '?name')
        ));
        this._where.addComponent('BIND(IF(bound(?name), ?name, ?orcid) as ?name)');
        return this;
    }

    private _addPrefix() {
        this.prefix(
            prefix('rdf', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>'),
            prefix('rdfs', '<http://www.w3.org/2000/01/rdf-schema#>'),
            prefix('dc', '<http://purl.org/dc/elements/1.1/>'),
            prefix('metago', '<http://model.geneontology.org/>'),
            prefix('owl', '<http://www.w3.org/2002/07/owl#>'),
            prefix('GO', '<http://purl.obolibrary.org/obo/GO_>'),
            prefix('BP', '<http://purl.obolibrary.org/obo/GO_0008150>'),
            prefix('MF', '<http://purl.obolibrary.org/obo/GO_0003674>'),
            prefix('CC', '<http://purl.obolibrary.org/obo/GO_0005575>'),
            prefix('providedBy', '<http://purl.org/pav/providedBy>'),
            prefix('vcard', '<http://www.w3.org/2006/vcard/ns#>'),
            prefix('has_affiliation', '<http://purl.obolibrary.org/obo/ERO_0000066>'),
            prefix('enabled_by', '<http://purl.obolibrary.org/obo/RO_0002333>'),
            prefix('obo', '<http://www.geneontology.org/formats/oboInOwl#>'));
    }

    private _addTemplate() {
        this._graph.addComponent('?model metago:graphType metago:noctuaCam; dc:date ?date; dc:title ?modelTitle; dc:contributor ?orcid');
        this._graph.addComponent(optional('?model providedBy: ?providedBy'));
        this._graph.addComponent(triple('?entity ', 'rdf:type', 'owl:NamedIndividual'));
        this._graph.addComponent(triple('?entity', 'rdf:type', '?term'));


        this._where.addComponent(this._graph);
        this._where.addComponent('VALUES ?aspect { BP: MF: CC: }');
        this._where.addComponent(triple('?entity', 'rdf:type', '?aspect'));
        this._where.addComponent(triple('?term', 'rdfs:label', '?termLabel'));

        this.select(
            'distinct ?model ?modelTitle ?aspect ?term ?termLabel ?date',
            '(GROUP_CONCAT(distinct ?entity;separator="@@") as ?entities)',
            '(GROUP_CONCAT(distinct ?orcid;separator="@@") as ?contributors)',
            '(GROUP_CONCAT(distinct ?providedBy;separator="@@") as ?groups)'
        )

        this.addClause(this._where
        ).groupBy('?model ?modelTitle ?aspect ?term ?termLabel ?date'
        ).orderBy('?date', 'DESC');
    }
}


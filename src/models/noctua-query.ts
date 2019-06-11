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
        this._graph.addComponent(triple('?entity', 'rdf:type', goTermId));
        return this;
    }

    gp(gpIRI: string) {
        this._graph.addComponent(triple('?s', 'enabled_by:', '?gpEntity'));
        this._graph.addComponent(triple('?gpEntity', 'rdf:type', `<${gpIRI}>`));

        return this;
    }

    pmid(pmid: string) {
        this._graph.addComponent(triple('?axiom', 'evidence:', '?evidence'));
        this._graph.addComponent(triple('?axiom', 'owl:annotatedSource', '?entity'))
        this._graph.addComponent(triple('?evidence', 'dc:source', '?source'));
        this._graph.addComponent('BIND(REPLACE(?source, " ", "") AS ?source)');
        this._graph.addComponent(`FILTER(?source="${pmid}")`);

        return this;
    }

    contributor(orcid: string) {
        this._graph.addComponent(triple('?model', 'dc:contributor', orcid));

        return this;
    }

    group(groupIRI: string) {
        this._graph.addComponent(triple('?model', 'providedBy:', groupIRI));

        return this;
    }

    state(state: string) {
        this._graph.addComponent(triple('?model', 'modelState:', state));

        return this;
    }

    taxon(taxonIRI: string) {
        this._graph.addComponent(triple('?s', 'enabled_by:', '?entity'));
        this._graph.addComponent(triple('?entity', 'rdf:type', '?identifier'));
        this._graph.addComponent('FILTER(?identifier != owl:NamedIndividual)');

        this._where.addComponent(triple('?identifier', 'rdfs:subClassOf', '?v0'));
        this._where.addComponent(triple('?identifier', 'rdfs:label', ' ?name'));
        this._where.addComponent(triple('?v0', 'owl:onProperty', ' in_taxon:'));
        this._where.addComponent(triple('?v0', 'owl:someValuesFrom', `<${taxonIRI}>`));

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
            prefix('modelState', '<http://geneontology.org/lego/modelstate>'),
            prefix('providedBy', '<http://purl.org/pav/providedBy>'),
            prefix('vcard', '<http://www.w3.org/2006/vcard/ns#>'),
            prefix('has_affiliation', '<http://purl.obolibrary.org/obo/ERO_0000066>'),
            prefix('enabled_by', '<http://purl.obolibrary.org/obo/RO_0002333>'),
            prefix('evidence', '<http://geneontology.org/lego/evidence>'),
            prefix('in_taxon', '<http://purl.obolibrary.org/obo/RO_0002162>'),
            prefix('obo', '<http://www.geneontology.org/formats/oboInOwl#>'));
    }

    private _addTemplate() {
        this._graph.addComponent('?model metago:graphType metago:noctuaCam; dc:date ?date; dc:title ?modelTitle; modelState: ?modelState; providedBy: ?providedBy; dc:contributor ?orcid');
        this._graph.addComponent(optional('?model providedBy: ?providedBy'));
        //this._graph.addComponent(triple('?entity', 'rdf:type', '?term'));

        this._where.addComponent(this._graph);

        this.select(
            'distinct ?model ?modelTitle ?modelState ?date',
            '(GROUP_CONCAT(distinct ?entity;separator="@@") as ?entities)',
            '(GROUP_CONCAT(distinct ?orcid;separator="@@") as ?contributors)',
            '(GROUP_CONCAT(distinct ?providedBy;separator="@@") as ?groups)'
        )

        this.addClause(this._where
        ).groupBy('?model ?modelTitle ?modelState ?date'
        ).orderBy('?date', 'DESC');
    }
}


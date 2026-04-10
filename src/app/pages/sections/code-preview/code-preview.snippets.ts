export const BEFORE_CODE_SNIPPET = `<span class="code-keyword">import</span> { Component } <span class="code-keyword">from</span> <span class="code-string">'@angular/core'</span>;
<span class="code-keyword">import</span> { trigger, transition, style, animate } <span class="code-keyword">from</span> <span class="code-string">'@angular/animations'</span>;

<span class="code-attr">@Component</span>({
  selector: <span class="code-string">'my-component'</span>,
  template: <span class="code-string">\`&lt;div @fadeUp *ngIf="show"&gt;Content&lt;/div&gt;\`</span>,
  animations: [
    <span class="code-keyword">trigger</span>(<span class="code-string">'fadeUp'</span>, [
      <span class="code-keyword">transition</span>(<span class="code-string">':enter'</span>, [
        <span class="code-keyword">style</span>({ opacity: 0, transform: <span class="code-string">'translateY(20px)'</span> }),
        <span class="code-keyword">animate</span>(<span class="code-string">'300ms ease-out'</span>, <span class="code-keyword">style</span>({ opacity: 1, transform: <span class="code-string">'translateY(0)'</span> }))
      ])
    ])
  ]
})
<span class="code-keyword">export class</span> MyComponent {
  show = <span class="code-keyword">true</span>;
}`;

export const AFTER_CODE_SNIPPET = `<span class="code-keyword">import</span> { Component } <span class="code-keyword">from</span> <span class="code-string">'@angular/core'</span>;
<span class="code-keyword">import</span> { MOVEMENT_DIRECTIVES } <span class="code-keyword">from</span> <span class="code-string">'@angular-movement/core'</span>;

<span class="code-attr">@Component</span>({
  selector: <span class="code-string">'my-component'</span>,
  imports: [...MOVEMENT_DIRECTIVES],
  template: <span class="code-string">\`
    &#64;if (show) {
      &lt;div moveEnter="fade-up"&gt;Content&lt;/div&gt;
    }
  \`</span>
})
<span class="code-keyword">export class</span> MyComponent {
  show = <span class="code-keyword">true</span>;
}`;

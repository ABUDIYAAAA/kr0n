package email

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"sort"
	"strings"
	texttpl "text/template"
)

type Renderer struct {
	dir string
}

func NewRenderer(dir string) *Renderer {
	if strings.TrimSpace(dir) == "" {
		dir = "templates"
	}
	return &Renderer{dir: dir}
}

func (r *Renderer) Render(templateName string, data any) (RenderedEmail, error) {
	htmlBody, err := r.renderHTML(templateName, data)
	if err != nil {
		return RenderedEmail{}, err
	}

	textBody, err := r.renderText(templateName, data)
	if err != nil {
		return RenderedEmail{}, err
	}

	subject := inferSubject(data, templateName)
	return RenderedEmail{Subject: subject, HTML: htmlBody, Text: textBody}, nil
}

func (r *Renderer) renderHTML(templateName string, data any) (string, error) {
	basePath := filepath.Join(r.dir, "base.html")
	bodyPath := filepath.Join(r.dir, templateName+".html")

	baseBytes, err := os.ReadFile(basePath)
	if err != nil {
		return "", fmt.Errorf("read base html template: %w", err)
	}
	bodyBytes, err := os.ReadFile(bodyPath)
	if err != nil {
		return "", fmt.Errorf("read html template %q: %w", templateName, err)
	}

	funcs := template.FuncMap{
		"toUpper": strings.ToUpper,
	}
	parsed, err := template.New("base.html").Funcs(funcs).Parse(string(baseBytes))
	if err != nil {
		return "", fmt.Errorf("parse base html template: %w", err)
	}
	parsed, err = parsed.Parse(string(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("parse html template %q: %w", templateName, err)
	}

	var buf bytes.Buffer
	if err := parsed.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("render html template %q: %w", templateName, err)
	}
	return buf.String(), nil
}

func (r *Renderer) renderText(templateName string, data any) (string, error) {
	basePath := filepath.Join(r.dir, "base.txt")
	bodyPath := filepath.Join(r.dir, templateName+".txt")

	baseBytes, err := os.ReadFile(basePath)
	if err != nil {
		return "", fmt.Errorf("read base text template: %w", err)
	}
	bodyBytes, err := os.ReadFile(bodyPath)
	if err != nil {
		return "", fmt.Errorf("read text template %q: %w", templateName, err)
	}

	funcs := texttpl.FuncMap{
		"toUpper": strings.ToUpper,
	}
	parsed, err := texttpl.New("base.txt").Funcs(funcs).Parse(string(baseBytes))
	if err != nil {
		return "", fmt.Errorf("parse base text template: %w", err)
	}
	parsed, err = parsed.Parse(string(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("parse text template %q: %w", templateName, err)
	}

	var buf bytes.Buffer
	if err := parsed.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("render text template %q: %w", templateName, err)
	}
	return buf.String(), nil
}

func inferSubject(data any, fallback string) string {
	if payload, ok := data.(map[string]any); ok {
		if subject, ok := payload["subject"].(string); ok && strings.TrimSpace(subject) != "" {
			return subject
		}
	}
	return strings.ReplaceAll(strings.Title(strings.ReplaceAll(fallback, "_", " ")), "  ", " ")
}

func ListTemplates(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	set := map[string]struct{}{}
	for _, entry := range entries {
		name := entry.Name()
		if strings.HasSuffix(name, ".html") || strings.HasSuffix(name, ".txt") {
			base := strings.TrimSuffix(strings.TrimSuffix(name, ".html"), ".txt")
			if base == "base" {
				continue
			}
			set[base] = struct{}{}
		}
	}
	out := make([]string, 0, len(set))
	for name := range set {
		out = append(out, name)
	}
	sort.Strings(out)
	return out, nil
}

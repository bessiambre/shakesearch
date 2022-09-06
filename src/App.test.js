import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ShakeShakeGo title', () => {
  render(<App />);
  const titleElement = screen.getByText(/ShakeShakeGo/i);
  expect(titleElement).toBeInTheDocument();
});
